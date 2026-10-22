## Why

A [US-BE-09] deixou o banco e a API prontos para imagens em arquivo (`thumbnail_path`, `full_image_path`, `sample_image_path`, `toUploadUrl` e o volume `uploads_data`), mas ainda não há como enviar uma foto nem como servir os arquivos. O catálogo não tem fotos e a listagem nem devolve miniatura. A [US-BE-10] fecha o RF02 e o RNF02 do PRD: receber as fotos de produto e as amostras de variação como arquivo, reconvertê-las em WebP leve no servidor, servir os arquivos com cache longo e incluir o volume no backup da VM.

## What Changes

- **Envio de fotos do produto** (`POST /api/v1/produtos/:id/imagens`, `multipart/form-data`, uma imagem por requisição, `variationId` opcional):
  - Recusa acima de 2 MiB (2.097.152 bytes) pelo `Content-Length`, antes de ler o corpo, e de novo pelo tamanho real do arquivo. Responde `400` com o tamanho enviado e o limite.
  - Aceita só JPEG, PNG e WebP, identificados pelo conteúdo do arquivo e não pela extensão nem pelo `Content-Type`.
  - Gera com `Bun.Image`, nativo do Bun e sem dependência nova, a miniatura WebP (lado maior até 480 px) e a imagem completa WebP (lado maior até 1920 px). A reconversão descarta o EXIF, inclusive o GPS.
  - Grava os arquivos com nome UUID gerado pelo servidor em `products/<productId>/` e insere a linha em `product_images`. A ordem é definida pelo servidor (último `sort_order` + 1). Se o banco falhar, os arquivos recém-gravados são apagados.
- **Exclusão de foto** (`DELETE /api/v1/produtos/:id/imagens/:imageId`): soft delete da linha, mantendo o arquivo no volume.
- **Amostra de variação** (`PUT` e `DELETE /api/v1/produtos/:id/variacoes/:variationId/amostra`): o `PUT` grava uma amostra WebP (lado maior até 512 px) em `variations/<variationId>/` e atualiza `sample_image_path`, sempre com arquivo novo. O `DELETE` volta o campo para `null`.
- **Autorização**: as rotas de escrita usam a mesma regra do `PUT /api/v1/produtos/:id`. Admin tem acesso global; Vendedor só nos fornecedores vinculados, com `403 Forbidden` fora deles.
- **Leitura dos arquivos** (`GET /api/v1/uploads/:scope/:ownerId/:file`): aceita só o padrão de nome gerado pelo servidor (lista branca por regex) e responde `Cache-Control: public, max-age=31536000, immutable`. Não consulta o banco, então a URL de uma foto excluída continua abrindo.
- **Capa na listagem**: cada item de `GET /api/v1/produtos` passa a trazer `thumbnailUrl`, vindo da primeira foto sem variação, depois da primeira foto de variação, ou `null` quando o produto não tem foto.
- **Infraestrutura**:
  - `UPLOADS_DIR` configurável em `env.ts`.
  - Versão da imagem `oven/bun` fixada no `Dockerfile`, com o `Bun.Image` validado no Alpine.
  - `scripts/backup.sh` gera o dump do banco e, depois, o `.tar.gz` do volume de uploads com o mesmo timestamp; `scripts/restore.sh` restaura os dois pelo timestamp.

## Capabilities

### New Capabilities
- `backend-product-image-uploads`: envio, validação, reconversão para WebP, gravação em disco e exclusão das fotos de produto e das amostras de variação; rota pública de leitura dos arquivos com cache imutável; backup e restauração do volume de uploads.

### Modified Capabilities
- `backend-products-crud`: a listagem paginada de `GET /api/v1/produtos` passa a devolver `thumbnailUrl` da capa de cada produto, seguindo a regra da foto sem variação.

## Impact

- **Backend**:
  - Novo módulo `backend/src/modules/product-images/` com as rotas de upload e exclusão, montado em `/produtos`.
  - Novo módulo `backend/src/modules/uploads/` com a leitura dos arquivos em `/api/v1/uploads`.
  - Novo `backend/src/lib/images.ts` (validação e reconversão com `Bun.Image`).
  - Evolução de `backend/src/lib/uploads.ts` (diretório e padrões de nome), `backend/src/config/env.ts` (`UPLOADS_DIR`), `backend/src/server.ts` (`maxRequestBodySize`), `products.service.ts` (autorização reutilizável) e `products.repository.ts` (capa).
- **Banco de dados**: nenhuma migração nova. As colunas e índices da `012_create_product_images.sql` já atendem.
- **Infraestrutura**: `backend/Dockerfile`, `scripts/backup.sh`, `scripts/restore.sh`.
- **Testes**: novos testes em `backend/tests/`, com fixtures de imagem e `UPLOADS_DIR` temporário.
- **Documentação**: `docs/backend/README.md`, collection Bruno em `docs/backend/collections/bruno/Products/` e critérios da US-BE-10 no backlog. O PRD e o backlog já foram atualizados com as regras desta change.
- **Dependências entre histórias**:
  - **US-FE-08** passa a conferir tamanho e formato antes de enviar e a enviar as fotos depois que o produto tem `id`.
  - O frontend monta o endereço das imagens com a base `VITE_API_URL`, porque o Vite não tem proxy de `/api`.
