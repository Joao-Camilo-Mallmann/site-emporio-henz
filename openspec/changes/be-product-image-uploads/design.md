## Context

O porquê está em `proposal.md`, e os requisitos em `specs/backend-product-image-uploads/spec.md` e `specs/backend-products-crud/spec.md`. Este documento cobre só o estado atual e as escolhas técnicas.

Estado atual relevante:
- `product_images` (`012`) e `product_variations.sample_image_path` (`011`) já guardam caminhos em `VARCHAR(255)`. Não há migração nova.
- `backend/src/lib/uploads.ts` só converte caminho em URL (`toUploadUrl`, prefixo `/api/v1/uploads`).
- O `Router` (`backend/src/lib/router.ts`) casa cada `:param` com `([^/]+)`, um segmento só, sem curinga. Ele aplica `decodeURIComponent` nos parâmetros.
- `Bun.serve` (`backend/src/server.ts`) usa o `maxRequestBodySize` padrão (128 MB), e o nginx limita o corpo em `10M`.
- O backend não tem dependências de runtime. O Bun 1.4.3 traz o `Bun.Image`, que decodifica JPEG, PNG e WebP, redimensiona e codifica WebP.
- `backend/Dockerfile` usa `oven/bun:1-alpine`, uma tag que muda de versão sozinha.
- `ProductsService` repete em `updateProduct` e `deleteProduct` o mesmo bloco de autorização: `resolveSellerSupplierIds`, `findById` e `assertSellerOwnsSupplier`. Os dois helpers são privados.
- `ProductDto`, usado na listagem, nas recomendações e como base do detalhe, não tem campo de imagem.
- O frontend chama a API por `VITE_API_URL` (axios), sem proxy de `/api` no Vite.

Teste feito na exploração com as fotos do repositório: um PNG de 2056 KB virou miniatura de 16,9 KB (480 px, WebP q75) e imagem completa de 98 KB em 152 ms. Um texto disfarçado de imagem foi recusado com `ERR_IMAGE_UNKNOWN_FORMAT`, e um JPEG com EXIF injetado saiu sem o EXIF em WebP e em JPEG.

## Goals / Non-Goals

**Goals:**
- Processar imagens só com `Bun.Image`, sem dependência nova.
- Não ler nenhum corpo de upload antes de conferir autorização e `Content-Length`.
- Impedir path traversal por construção, aceitando só nomes gerados pelo servidor.
- Unificar a autorização de escrita de produto num único método reutilizável.

**Non-Goals:**
- Reordenar fotos ou trocar a variação de uma foto já enviada.
- Apagar arquivos do disco ou limpar arquivos órfãos.
- Mudar o frontend. O helper de URL com `VITE_API_URL` e a checagem de tamanho no formulário ficam na US-FE-08 e nas telas do catálogo.
- Adicionar proxy de `/api` no Vite.
- Mudar o que acontece com fotos vinculadas a variação removida no `PUT /produtos/:id` (ver Open Questions).

## Decisions

### 1. `Bun.Image` em vez de `sharp` ou de redimensionar no navegador
- **Decisão**: um helper `processImage(bytes, preset)` em `backend/src/lib/images.ts` com três presets:

  | Preset | Lado maior | WebP quality | Uso |
  |---|---|---|---|
  | `thumb` | 480 px | 75 (cai para 60 e 45 se passar de 50 KiB) | `thumbnail_path` |
  | `full` | 1920 px | 85 | `full_image_path` |
  | `sample` | 512 px | 80 | `sample_image_path` |

  Todos usam `resize(n, n, { fit: "inside", withoutEnlargement: true })`, `autoOrient` (padrão, aplica a rotação do EXIF antes de descartá-lo) e `maxPixels: 40_000_000` no construtor. A queda de qualidade da miniatura garante o "< 50 KB" do PRD mesmo em foto de textura muito detalhada.
- **Alternativas rejeitadas**:
  - `sharp`: traz uma dependência nativa com binários de libvips específicos para musl no Alpine, sem ganho para o volume deste catálogo.
  - Redimensionar no navegador: o PRD decidiu que o front não comprime, e o servidor precisaria reconverter de qualquer forma para remover EXIF e neutralizar arquivo disfarçado.

### 2. Formato pelo conteúdo, com `metadata()` antes de processar
- **Decisão**: o `Bun.Image(bytes).metadata()` lê só o cabeçalho. Ele recusa `ERR_IMAGE_UNKNOWN_FORMAT`, `ERR_IMAGE_DECODE_FAILED` e `ERR_IMAGE_TOO_MANY_PIXELS` e aceita apenas `format ∈ {jpeg, png, webp}`. Todo erro do `Bun.Image` vira `BadRequestError` com a mensagem do RNF02. A extensão e o `Content-Type` do campo são ignorados.
- **Alternativa rejeitada**: confiar em `file.type`, que o cliente controla e que aceitaria `foto.jpg` com conteúdo arbitrário.

### 3. Ordem das checagens no upload
```text
 POST /produtos/:id/imagens
   │
   ├─ authMiddleware ─────────────────────────────► 401
   ├─ requireRole(SELLER, ADMIN) ─────────────────► 403
   ├─ productsService.assertCanManageProduct(id) ─► 404 / 403
   ├─ Content-Length ausente ou > 2 MiB + 64 KiB ─► 400   (corpo não lido)
   ├─ req.formData(); exatamente 1 File em `file` ► 400
   ├─ file.size > 2.097.152 ──────────────────────► 400 "A imagem tem X MB; o limite é 2 MB."
   ├─ variationId ativo e do mesmo produto? ──────► 400
   ├─ metadata(): formato e maxPixels ────────────► 400
   ├─ processImage(thumb) + processImage(full)    (em memória)
   ├─ grava os 2 arquivos
   └─ transação ─┬─ SELECT … FROM products WHERE id = $1 AND deleted_at IS NULL FOR UPDATE
                 ├─ sort_order = COALESCE(MAX(sort_order), -1) + 1 (fotos ativas)
                 ├─ INSERT product_images (id = imageId)
                 └─ falhou? ─► rm dos 2 arquivos e repropaga o erro
```
- A folga de 64 KiB no `Content-Length` cobre o envelope do multipart (boundaries, `variationId`). O limite exato vale para `file.size`.
- `Bun.serve` passa a usar `maxRequestBodySize: 10 * 1024 * 1024`, igual ao nginx, como última barreira para qualquer rota.
- O `FOR UPDATE` no produto serializa uploads simultâneos do mesmo produto, para que dois envios não recebam o mesmo `sort_order`. Ele também fecha a corrida em que o produto é desativado durante o upload.
- **Alternativa rejeitada**: conferir o tamanho antes da autorização. Isso responderia `400` a quem nem pode operar o produto. A autorização não lê o corpo e custa duas queries.

### 4. Nomes e pastas no volume
- **Decisão**:
  - Fotos: `products/<productId>/<imageId>-thumb.webp` e `products/<productId>/<imageId>-full.webp`, em que `imageId = crypto.randomUUID()` também é o `id` da linha em `product_images`. Arquivo e linha se identificam pelo nome, o que facilita auditar órfãos depois.
  - Amostras: `variations/<variationId>/<uuid>.webp`, com UUID novo a cada envio.
  - Pastas criadas com `mkdir({ recursive: true })`.
  - `UPLOADS_DIR` vem de `env.ts` (padrão `<cwd>/uploads`, que é `/app/uploads` no container). Os testes apontam para um diretório temporário.
- **Alternativa rejeitada**: pasta única com todos os arquivos. Fica mais difícil ver o que pertence a qual produto ao inspecionar ou restaurar o volume.

### 5. Rota de leitura com profundidade fixa e lista branca
- **Decisão**: o módulo `backend/src/modules/uploads/` registra `GET /:scope/:ownerId/:file`, montado em `/uploads`. O handler valida:
  - `scope`: `products` ou `variations`;
  - `ownerId`: `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/`;
  - `file`: `/^<uuid>-(thumb|full)\.webp$/` em `products` e `/^<uuid>\.webp$/` em `variations`.

  Fora disso, responde `404`. Como os três segmentos casam só com hex, `-` e `.webp`, nenhum `..`, `/` decodificado ou caminho absoluto chega ao `path.join(UPLOADS_DIR, …)`. Arquivo inexistente também dá `404`. A resposta usa `new Response(Bun.file(path))` com `Content-Type: image/webp`, `Cache-Control: public, max-age=31536000, immutable` e `X-Content-Type-Options: nosniff`. A rota não consulta o banco.
- **Alternativas rejeitadas**:
  - Curinga `*` no `Router`: mexe no roteamento de todas as rotas e exige barrar traversal com `resolve` + `startsWith`.
  - Desvio em `app.ts`: deixa uma rota fora do padrão de módulos.
  - nginx servindo o volume direto: o dev (sem nginx) ficaria diferente da produção.

### 6. Autorização reaproveitada do `ProductsService`
- **Decisão**: extrair o bloco repetido de `updateProduct`/`deleteProduct` para o método público `assertCanManageProduct(productId, actor): Promise<ProductDto>`, que lança `404`/`403` e devolve o produto. `updateProduct`, `deleteProduct` e o novo `ProductImagesService` passam a chamá-lo, e as mensagens do PRD (E1, E2/E3) continuam as mesmas.
- **Alternativa rejeitada**: copiar o bloco no serviço de imagens, criando uma terceira cópia da regra mais sensível do sistema (RNF09).

### 7. Módulo `product-images` montado em `/produtos`
- **Decisão**: `backend/src/modules/product-images/` (`*.routes.ts`, `*.controller.ts`, `*.service.ts`, `*.repository.ts`, `*.types.ts`) com as rotas `POST /:id/imagens`, `DELETE /:id/imagens/:imageId`, `PUT /:id/variacoes/:variationId/amostra` e `DELETE /:id/variacoes/:variationId/amostra`, registrado com `apiRouter.use("/produtos", productImagesRoutes)`, no mesmo padrão de `users` + `user-suppliers`. Os DTOs de resposta reaproveitam `ProductImageDto` e `ProductVariationDto` e os mapeadores do repositório de produtos.
- **Respostas**: `201` com `ProductImageDto` no `POST`; `200` com `{ message }` no `DELETE` da foto, como no `DELETE /produtos/:id`; `200` com `ProductVariationDto` no `PUT` e no `DELETE` da amostra.
- **Alternativa rejeitada**: colocar tudo em `products.*`, que já passa de 550 linhas no repositório.

### 8. Capa da listagem com `LEFT JOIN LATERAL`
- **Decisão**: um fragmento SQL comum às consultas de `ProductDto` (`listPaginated`, `findById` e `findRecommendations`):
  ```sql
  LEFT JOIN LATERAL (
    SELECT pi.thumbnail_path
    FROM product_images pi
    WHERE pi.product_id = p.id AND pi.deleted_at IS NULL
    ORDER BY (pi.variation_id IS NOT NULL), pi.sort_order, pi.created_at
    LIMIT 1
  ) cover ON true
  ```
  O `ProductDto` ganha `thumbnailUrl: string | null`, e o índice `idx_product_images_product_active (product_id, sort_order)` já atende. As recomendações ganham o campo também: a mudança é aditiva e os cards de recomendação precisam da mesma capa.
- **Alternativa rejeitada**: subquery correlacionada no `SELECT`. Funciona igual, mas o `LATERAL` deixa a regra num só lugar e permite trazer outros campos da capa depois.

### 9. Backup: dump primeiro, tar depois
- **Decisão**: `backup.sh` roda o `pg_dump` (como hoje) e depois `docker compose exec -T backend tar czf - -C /app uploads > backups/uploads_<TS>.tar.gz`, com o mesmo `<TS>`. Usar o container `backend` evita depender do nome do volume, que leva o prefixo do projeto compose. Como arquivos nunca são apagados, o tar feito depois do dump contém todos os caminhos que o dump referencia. O `restore.sh` passa a receber o timestamp, restaura o banco e então extrai o tar em `/app/uploads` (`docker compose exec -T backend tar xzf - -C /app`). A retenção de 30 dias passa a valer para os dois padrões de arquivo.
- **Alternativa rejeitada**: um único `.tar.gz` com dump e fotos, que obriga a desempacotar tudo para restaurar só o banco.

### 10. Versão fixa do Bun no Docker
- **Decisão**: trocar `oven/bun:1-alpine` por `oven/bun:1.4.3-alpine`, a versão local validada. O `Bun.Image` usa codecs estáticos, mas o teste no Alpine (musl) é uma tarefa explícita antes de concluir a change.

## Risks / Trade-offs

- [O `Bun.Image` é recente e pode mudar de API ou de comportamento entre versões] → Versão fixa no Dockerfile e testes de processamento cobrindo tamanho, formato e ausência de EXIF.
- [Decodificar uma foto de 40 MP usa ~160 MB de RAM, e vários uploads ao mesmo tempo podem pressionar a VM] → `maxPixels` em 40 MP. Com poucos vendedores e uma foto por requisição, a concorrência real é baixa. Se virar problema, um semáforo no `processImage` resolve sem mudar o contrato.
- [Arquivos nunca são apagados e o volume só cresce] → É o que o PRD decide. A estimativa é de ~120 KB por foto, poucos MB no total.
- [Upload interrompido entre gravar os arquivos e o `INSERT` deixa órfãos se o processo morrer] → A compensação cobre erros do banco, mas não um `kill` do processo. Os órfãos não são referenciados nem expostos, e o nome igual ao `id` da linha permite auditar depois.
- [A URL de foto excluída continua pública] → É uma decisão do PRD: o UUID não é adivinhável e o cache imutável já entregue não seria revogado de qualquer forma.
- [`req.formData()` carrega o corpo inteiro na memória] → O corpo só é lido depois da checagem de `Content-Length` (≤ 2 MiB + 64 KiB), e o `maxRequestBodySize` de 10 MiB é a última barreira.
- [O PRD (RNF10) e o comentário de `uploads.ts` falam de proxy do Vite, que não existe] → O comentário de `uploads.ts` é corrigido nesta change. O texto do RNF10 fica para quem tratar da sessão.

## Migration Plan

1. Sem migração de banco. O deploy normal (`deploy.sh`) rebuilda a imagem com o Bun fixado e sobe o backend com as rotas novas.
2. O uso do `scripts/restore.sh` muda de `<arquivo.sql.gz>` para `<timestamp>`. Backups antigos, que só têm `.sql.gz`, continuam restauráveis com uma flag `--db-only <arquivo>`.
3. Rollback: voltar a imagem anterior. As linhas e arquivos criados continuam válidos para a versão anterior, que só lê `*_path`.

## Open Questions

- Fotos vinculadas a uma variação removida pela sincronização do `PUT /produtos/:id` continuam ativas e aparecem no carrossel (comportamento da US-BE-09). Esta change não altera isso. Decidir depois se elas viram fotos gerais ou recebem soft delete junto com a variação.
