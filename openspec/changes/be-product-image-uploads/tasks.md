## 1. [INFRA] Base de configuração

- [x] 1.1 Adicionar `UPLOADS_DIR` em `backend/src/config/env.ts` (padrão `<cwd>/uploads`) e verificar com teste que a variável de ambiente sobrescreve o padrão
- [x] 1.2 Fixar `oven/bun:1.4.3-alpine` em `backend/Dockerfile` e verificar com `docker compose --profile prod build backend` seguido de um `docker compose run --rm backend bun -e` que processa uma imagem com `Bun.Image` dentro do container Alpine
- [x] 1.3 Definir `maxRequestBodySize: 10 * 1024 * 1024` no `Bun.serve` de `backend/src/server.ts` e verificar com `curl` que um corpo de 11 MB é recusado

## 2. [BE] Processamento e caminhos de imagem (`backend/src/lib/`)

- [x] 2.1 Criar `backend/src/lib/images.ts` com a validação por `metadata()` (só `jpeg`, `png`, `webp`; `maxPixels` de 40 MP; erros do `Bun.Image` viram `BadRequestError`) e `processImage` com os presets `thumb` (480 px, q75 caindo para 60 e 45 até ficar abaixo de 50 KiB), `full` (1920 px, q85) e `sample` (512 px, q80). Verificar com testes usando fixtures em `backend/tests/fixtures/`: JPEG com EXIF, PNG, WebP, GIF, texto renomeado para `.jpg` e PNG que declara mais de 40 MP, conferindo dimensões, formato WebP, miniatura < 50 KiB e ausência de EXIF
- [x] 2.2 Evoluir `backend/src/lib/uploads.ts` com os montadores de caminho (`products/<productId>/<imageId>-thumb|full.webp`, `variations/<variationId>/<uuid>.webp`), as regex de `scope`, `ownerId` e `file`, `resolveUploadPath` (devolve `null` fora do padrão), gravação com `mkdir` recursivo e remoção para compensação. Corrigir o comentário que cita proxy do Vite. Verificar com testes que caminhos com `..`, `%2e%2e%2f`, escopo desconhecido e nome fora do padrão devolvem `null`
- [x] 2.3 Criar o leitor de multipart: recusa `Content-Length` ausente ou acima de 2 MiB + 64 KiB sem ler o corpo, exige exatamente um `File` em `file` e recusa `file.size` acima de 2.097.152 bytes com a mensagem do tamanho enviado e do limite. Verificar com testes que montam `Request` sem arquivo, com dois arquivos, com 2.097.153 bytes e com `Content-Length` de 8 MB

## 3. [BE] Ajustes no módulo de produtos

- [x] 3.1 Extrair `assertCanManageProduct(productId, actor)` em `products.service.ts` e usá-lo em `updateProduct` e `deleteProduct`, mantendo as mensagens E1, E2 e E3. Verificar que `backend/tests/products-service.test.ts` continua passando e que há testes novos para Admin, Vendedor vinculado, Vendedor de outro fornecedor e Vendedor sem vínculo
- [x] 3.2 Adicionar o `LEFT JOIN LATERAL` da capa em `listPaginated`, `findById` e `findRecommendations` e o campo `thumbnailUrl: string | null` em `ProductDto`. Verificar com testes do mapeador (caminho → URL e `null`) e, em banco local com seed, que a listagem traz a foto sem variação antes da foto de variação, cai para a de variação e devolve `null` sem foto

## 4. [BE] Módulo `product-images` (`backend/src/modules/product-images/`)

- [x] 4.1 Criar o repositório com variação ativa do produto, inserção transacional com `SELECT … FOR UPDATE` no produto e `sort_order = COALESCE(MAX, -1) + 1`, soft delete da foto restrito ao produto e gravação e limpeza de `sample_image_path`. Verificar com teste de tipos (`bun run check-types`) e com execução manual em banco local, conferindo `sort_order` sequencial em dois uploads simultâneos
- [x] 4.2 Criar o serviço com `uploadProductImage` (autorização → tamanho → variação → formato → processamento → gravação → transação, apagando os arquivos se o banco falhar), `deleteProductImage`, `putVariationSample` e `deleteVariationSample`. Verificar com testes de repositório falso: `403` antes de ler o corpo, `400` para variação de outro produto, `404` para produto desativado, arquivos apagados quando o `INSERT` falha, amostra sempre com nome novo e arquivo anterior preservado
- [x] 4.3 Criar controller e rotas (`POST /:id/imagens`, `DELETE /:id/imagens/:imageId`, `PUT` e `DELETE /:id/variacoes/:variationId/amostra`) com `authMiddleware` + `requireRole(ROLES.SELLER, ROLES.ADMIN)` e registrar em `backend/src/routes/index.ts` com `apiRouter.use("/produtos", …)`. Verificar com testes pelo `apiRouter`: `401` sem cookie, `403` para Cliente, `201` com `ProductImageDto` para Admin, `200` com `{ message }` no `DELETE` e `404` para foto de outro produto

## 5. [BE] Leitura pública dos arquivos (`backend/src/modules/uploads/`)

- [x] 5.1 Criar a rota `GET /:scope/:ownerId/:file` montada em `/uploads`, servindo `Bun.file` com `Content-Type: image/webp`, `Cache-Control: public, max-age=31536000, immutable` e `X-Content-Type-Options: nosniff`, sem consultar o banco. Verificar com testes num `UPLOADS_DIR` temporário: `200` com os cabeçalhos, `404` para escopo desconhecido, `ownerId` inválido, `..`, `%2e%2e%2f` e arquivo inexistente, e `200` para arquivo de foto excluída

## 6. [INFRA] Backup e restauração

- [x] 6.1 Evoluir `scripts/backup.sh` para gerar o dump e, depois, `uploads_<TS>.tar.gz` via `docker compose exec -T backend tar`, com o mesmo timestamp e retenção de 30 dias para os dois padrões. Verificar rodando o script com o compose de produção local e conferindo os dois arquivos em `backups/` e o conteúdo do tar (`tar tzf`)
- [x] 6.2 Evoluir `scripts/restore.sh` para receber o timestamp, restaurar o banco e extrair o tar em `/app/uploads`, mantendo `--db-only <arquivo.sql.gz>` para backups antigos. Verificar restaurando num stack limpo e abrindo a `thumbnailUrl` de uma foto restaurada com `200`
- [x] 6.3 Atualizar as instruções de backup e restauração no `README.md` da raiz e verificar que o exemplo de uso bate com os scripts

## 7. [DOCS] Documentação e verificação final

- [x] 7.1 Documentar em `docs/backend/README.md` as rotas de imagem, os limites, a reconversão para WebP, a regra da capa e o layout de pastas do volume. Verificar que os exemplos citam os mesmos caminhos e códigos de status dos specs
- [x] 7.2 Adicionar à collection Bruno `docs/backend/collections/bruno/Products/` os arquivos `Upload Product Image.bru`, `Delete Product Image.bru`, `Put Variation Sample.bru` e `Delete Variation Sample.bru`, e uma pasta `Uploads/` com `Get Upload File.bru`. Atualizar `List Products.bru` com `thumbnailUrl`. Verificar executando as requisições contra o backend local
- [x] 7.3 Executar `bun run check-types`, `bun run lint`, `bun test` e `bun run build` em `backend/` sem erros
- [x] 7.4 Validar de ponta a ponta com `docker compose --profile prod up -d --build`: enviar pelo nginx uma foto real abaixo de 2 MB (`201`, URL abrindo pelo nginx), uma acima de 2 MB (`400` em JSON), rodar `deploy.sh` de novo e confirmar que as URLs continuam `200`. Marcar os critérios da US-BE-10 em `docs/planning/user-stories-backlog.md`
