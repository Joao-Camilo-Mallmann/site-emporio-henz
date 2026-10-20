# Back-end

Documentação técnica da API do Empório Henz. Regras de negócio pertencem ao [PRD](../PRD.md); este guia descreve a implementação no serviço `backend/`.

## Referências

- [Código do serviço](../../backend/)
- [README operacional do serviço](../../backend/README.md)
- [Regras do back-end](../../backend/agents.md)
- [Collection Bruno](./collections/README.md)
- [Banco de dados](../database/README.md)

## Stack e convenções

- Bun com `Bun.serve` e TypeScript estrito.
- PostgreSQL 16 com driver SQL nativo do Bun.
- API versionada sob `/api/v1`.
- Senhas protegidas com Argon2id e sessões com JWT.
- Testes unitários e de integração com `bun:test`.
- Exclusão lógica por `deleted_at` nas entidades de negócio.
- Imagens processadas com `Bun.Image`, nativo do runtime, sem dependência adicional. A imagem Docker fixa a versão do Bun (`oven/bun:1.4.3-alpine`), validada com o `Bun.Image` no Alpine.

## Estrutura do código

| Diretório | Responsabilidade |
| --- | --- |
| `backend/src/config/` | Ambiente (`env.ts`, inclusive `UPLOADS_DIR`) e conexão com o banco |
| `backend/src/lib/` | Roteador, respostas HTTP, JWT, senhas, erros, processamento de imagens (`images.ts`), caminhos e gravação de uploads (`uploads.ts`) e leitor de multipart (`multipart.ts`) |
| `backend/src/middlewares/` | Autenticação, RBAC e tratamento de erros |
| `backend/src/modules/` | Controllers, serviços, repositórios, schemas e tipos por domínio |
| `backend/src/routes/` | Composição das rotas da API V1 |
| `backend/database/` | Migrações e dados iniciais |
| `backend/tests/` | Testes automatizados (`tests/fixtures/` guarda as imagens dos testes de upload) |

Módulos atualmente registrados: autenticação, usuários, fornecedores, vínculos entre usuários e fornecedores, categorias, subtipos, produtos, imagens de produto (`product-images`, montado em `/produtos`) e leitura dos arquivos de imagem (`uploads`, montado em `/uploads`).

## Contrato HTTP

Erros seguem o formato:

```json
{
  "error": "NomeDoErro",
  "message": "Descrição amigável da falha."
}
```

Listagens são paginadas (RNF11 do PRD) e seguem o formato:

```json
{
  "data": [],
  "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 1 }
}
```

Parâmetros `page` e `limit` de cada rota estão na collection Bruno.

Status utilizados: `200`, `201`, `204`, `400`, `401`, `403`, `404`, `409` e `500`. O `Bun.serve` ainda responde `413` para qualquer corpo acima de 10 MiB (`maxRequestBodySize`, igual ao `client_max_body_size 10M` do nginx).

Papéis de acesso:

| Papel | Valor |
| --- | ---: |
| Cliente | `1` |
| Vendedor | `2` |
| Administrador | `3` |

O servidor aplica as permissões; ocultar ações no front-end não substitui a validação RBAC.

### Fluxo de Autorização e Escopo por Fornecedor (`/api/v1/produtos`)

```text
                       Requisição em /api/v1/produtos
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
   Visitante / Cliente         Vendedor (role = 2)         Admin (role = 3)
      (role = 1)                     │                           │
         │                           ├─ Sem vínculo ativo?       │
         ├─ GET / e GET /:id:        │  ──► 403 Forbidden (E1)   ├─ GET / e GET /:id:
         │  Vê apenas produtos       │                           │  Acesso global (ativos
         │  ativos (active=true)     ├─ GET /:                   │  e inativos de qualquer
         │                           │  Filtra por seus          │  fornecedor)
         └─ POST / PUT / DELETE:     │  user_suppliers ativos;   │
            ──► 401 / 403 Forbidden  │  se filtrar supplierId    └─ POST / PUT / DELETE:
                                     │  não vinculado ──► 403       Acesso global a
                                     │                              qualquer fornecedor
                                     ├─ GET /:id:
                                     │  Se produto é de outro
                                     │  fornecedor ──► 403
                                     │
                                     └─ POST / PUT / DELETE:
                                        Valida supplierId em
                                        user_suppliers ativos;
                                        se não pertencer ──► 403 (E2/E3)
```

A regra de escrita (E1, E2/E3 e `404` para produto inexistente ou desativado) vive num único método, `ProductsService.assertCanManageProduct(productId, actor)`, usado por `PUT /produtos/:id`, `DELETE /produtos/:id` e por todas as rotas de imagem abaixo. Ele não lê corpo de requisição, então roda antes de qualquer upload.

### Imagens (RF02 e RNF02)

Imagens não trafegam no JSON nem em Base64. Os arquivos ficam no diretório de uploads do backend (`UPLOADS_DIR`, padrão `<cwd>/uploads`; em produção o volume Docker `uploads_data`, montado em `/app/uploads`). O banco guarda só o caminho relativo (`product_images.thumbnail_path`, `product_images.full_image_path`, `product_variations.sample_image_path`), e as respostas devolvem URLs relativas no formato `/api/v1/uploads/<caminho>`, montadas por `toUploadUrl` em `src/lib/uploads.ts`. O frontend monta o endereço completo com a base `VITE_API_URL`.

#### Rotas

| Rota | Acesso | Corpo | Resposta |
| --- | --- | --- | --- |
| `POST /api/v1/produtos/:id/imagens` | Vendedor (escopo) / Admin | `multipart/form-data`: `file` (1 imagem), `variationId` opcional | `201` com `ProductImageDto` (`id`, `productId`, `variationId`, `thumbnailUrl`, `fullImageUrl`, `sortOrder`, `createdAt`) |
| `DELETE /api/v1/produtos/:id/imagens/:imageId` | Vendedor (escopo) / Admin | — | `200` com `{ message }`; `404` se a foto não é do produto ou já foi excluída |
| `PUT /api/v1/produtos/:id/variacoes/:variationId/amostra` | Vendedor (escopo) / Admin | `multipart/form-data`: `file` (1 imagem) | `200` com `ProductVariationDto` e novo `sampleImageUrl`; `404` se a variação não é do produto |
| `DELETE /api/v1/produtos/:id/variacoes/:variationId/amostra` | Vendedor (escopo) / Admin | — | `200` com `ProductVariationDto` e `sampleImageUrl: null` |
| `GET /api/v1/uploads/:scope/:ownerId/:file` | Público | — | `200` com o WebP, `Cache-Control: public, max-age=31536000, immutable`, `X-Content-Type-Options: nosniff`; `404` fora do padrão ou arquivo inexistente |

Todas as rotas de escrita exigem `authMiddleware` + `requireRole(SELLER, ADMIN)` (`401` sem token, `403` para Cliente) e conferem `assertCanManageProduct` antes de ler o arquivo. Identificadores que não são UUID respondem `400`.

#### Ordem das checagens do upload

```text
POST /produtos/:id/imagens
  ├─ authMiddleware ─────────────────────────────► 401
  ├─ requireRole(SELLER, ADMIN) ─────────────────► 403
  ├─ assertCanManageProduct(id) ─────────────────► 404 / 403
  ├─ Content-Length ausente ou > 2 MiB + 64 KiB ─► 400   (corpo não lido)
  ├─ req.formData(); exatamente 1 File em `file` ► 400
  ├─ file.size > 2.097.152 ──────────────────────► 400 "A imagem tem X MB (N bytes); o limite é 2 MB (2.097.152 bytes)."
  ├─ variationId ativo e do mesmo produto? ──────► 400
  ├─ metadata(): formato e maxPixels ────────────► 400
  ├─ processImage(thumb) + processImage(full)    (em memória)
  ├─ grava os 2 arquivos
  └─ transação: SELECT … FOR UPDATE no produto, sort_order = COALESCE(MAX, -1) + 1, INSERT
                └─ falhou? ─► apaga os 2 arquivos e repropaga o erro
```

#### Limites e reconversão para WebP

- Entrada: um arquivo por requisição, JPEG, PNG ou WebP, com até **2 MiB (2.097.152 bytes)**. O formato é lido do conteúdo pelo `Bun.Image(...).metadata()`; extensão e `Content-Type` da parte são ignorados. GIF, HEIC, BMP, AVIF e texto renomeado para `.jpg` respondem `400` com a lista de formatos aceitos.
- `Content-Length` acima de 2 MiB + 64 KiB (folga para o envelope do multipart) é recusado antes de o corpo ser lido. Acima de 10 MiB o `Bun.serve` responde `413`.
- Imagens que declaram mais de **40 megapixels** são recusadas antes da decodificação (`maxPixels`), para que um arquivo pequeno não consuma a memória da VM.
- Toda imagem aceita é reconvertida em WebP com `resize(n, n, { fit: "inside", withoutEnlargement: true })`, o que aplica a rotação do EXIF e descarta os metadados (inclusive GPS):

  | Preset | Lado maior | Qualidade WebP | Grava em |
  | --- | ---: | --- | --- |
  | `thumb` | 480 px | 75, caindo para 60 e 45 até ficar abaixo de 50 KiB | `product_images.thumbnail_path` |
  | `full` | 1920 px | 85 | `product_images.full_image_path` |
  | `sample` | 512 px | 80 | `product_variations.sample_image_path` |

- O servidor gera os nomes (UUID) e nunca usa o nome enviado pelo cliente. Trocar a amostra de uma variação gera um arquivo novo; o anterior fica no volume.
- Soft delete de foto, variação ou produto não apaga arquivo do volume, e a URL antiga continua respondendo `200`.
- Se a gravação em `product_images` falhar depois dos arquivos gravados, os arquivos daquela requisição são apagados (compensação).

#### Capa da listagem (`thumbnailUrl`)

Cada item de `GET /api/v1/produtos` (e das recomendações) traz `thumbnailUrl` e nenhuma outra URL de imagem. A capa é escolhida por um `LEFT JOIN LATERAL` em `products.repository.ts`:

1. a foto ativa **sem variação** de menor `sort_order`;
2. sem ela, a foto ativa **de variação** de menor `sort_order`;
3. sem nenhuma foto ativa, `thumbnailUrl: null`.

Quando a capa recebe soft delete, a listagem passa à próxima foto pela mesma regra. `GET /api/v1/produtos/:id` traz, além disso, `images` ordenadas por `sort_order` (com `thumbnailUrl` e `fullImageUrl`) e `variations` com `sampleImageUrl`.

#### Layout do volume de uploads

```text
/app/uploads                      (UPLOADS_DIR; volume uploads_data)
├── products/
│   └── <productId>/
│       ├── <imageId>-thumb.webp  (480 px)
│       └── <imageId>-full.webp   (1920 px)
└── variations/
    └── <variationId>/
        └── <uuid>.webp           (512 px; um arquivo novo por envio)
```

`imageId` é o mesmo `id` da linha em `product_images`, o que permite auditar arquivos órfãos. A rota de leitura aceita só esse padrão por lista branca (`scope` em `products`/`variations`, `ownerId` UUID, `file` no formato acima) e responde `404` para qualquer outra coisa, inclusive `..` ou `%2e%2e%2f`, sem acessar arquivos fora do diretório.

#### Backup

`scripts/backup.sh` gera, com o mesmo timestamp, o dump do banco e depois `uploads_<timestamp>.tar.gz` com `/app/uploads`; como nenhum arquivo é apagado, todo caminho do dump tem o arquivo no tar. `scripts/restore.sh <timestamp>` restaura os dois (`--db-only <arquivo.sql.gz>` para backups antigos). Instruções no [README da raiz](../../README.md#-backup-e-restauração-banco--fotos).

## Executar

```bash
cd backend
bun install
bun run migrate
bun run dev
```

A API fica disponível em `http://localhost:3001/api/v1` e o healthcheck em `GET /api/v1/health`. Na execução local as fotos ficam em `backend/uploads/` (ignorado pelo git); defina `UPLOADS_DIR` para usar outro diretório.

## Validar

```bash
cd backend
bun run check-types

bun run lint
bun test
bun run build
```

Para testar os contratos manualmente, abra `docs/backend/collections/bruno` no Bruno. Alterações de rota, parâmetro, payload, status ou resposta devem atualizar essa collection na mesma entrega.
