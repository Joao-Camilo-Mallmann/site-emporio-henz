# Capability: backend-product-image-uploads

## Purpose

Recebe as fotos de produto e as amostras de variação como arquivo, reconverte em WebP leve no servidor, grava no volume de uploads com o caminho no banco, serve os arquivos com cache imutável e inclui o volume no backup da VM.

## Requirements

### Requirement: Envio de Foto do Produto
O sistema MUST disponibilizar `POST /api/v1/produtos/:id/imagens` recebendo `multipart/form-data` com exatamente um arquivo no campo `file` e, opcionalmente, `variationId`. Para cada foto aceita, o sistema MUST gravar no volume de uploads uma miniatura WebP com lado maior de até 480 px e menos de 50 KB e uma imagem completa WebP com lado maior de até 1920 px, sem ampliar imagens menores. Os nomes dos arquivos MUST ser gerados pelo servidor (UUID), nunca vindos do cliente. O sistema MUST inserir em `product_images` apenas os caminhos relativos, com `sort_order` igual ao maior `sort_order` das fotos ativas do produto mais 1, e responder `201 Created` com `id`, `productId`, `variationId`, `thumbnailUrl`, `fullImageUrl` e `sortOrder`.

#### Scenario: Envio de foto JPEG válida por Administrador
- **WHEN** um Administrador envia `POST /api/v1/produtos/:id/imagens` com um JPEG de 1,5 MB e 4000×3000 px no campo `file` para um produto ativo
- **THEN** o sistema MUST responder `201 Created` com `thumbnailUrl` e `fullImageUrl` no formato `/api/v1/uploads/...`, e os dois arquivos MUST existir no volume de uploads em WebP, com 480×360 px e 1920×1440 px

#### Scenario: Metadados EXIF são descartados
- **WHEN** um usuário autorizado envia um JPEG que contém EXIF com localização GPS
- **THEN** nenhum dos arquivos gravados MUST conter os metadados EXIF da foto original

#### Scenario: Foto nova entra no fim do carrossel
- **WHEN** um produto já possui fotos ativas com `sort_order` 0, 1 e 2 e um usuário autorizado envia uma nova foto
- **THEN** a nova foto MUST ser gravada com `sort_order` 3

#### Scenario: Foto vinculada a uma variação do próprio produto
- **WHEN** um usuário autorizado envia uma foto com `variationId` de uma variação ativa do mesmo produto
- **THEN** o sistema MUST gravar a foto com esse `variation_id` e devolver `variationId` na resposta

#### Scenario: Variação de outro produto é recusada
- **WHEN** um usuário autorizado envia uma foto com `variationId` de uma variação inexistente, removida ou pertencente a outro produto
- **THEN** o sistema MUST responder `400 Bad Request` sem gravar arquivo nem linha no banco

#### Scenario: Produto inexistente ou desativado
- **WHEN** um usuário autorizado envia uma foto para um `:id` inexistente ou com `deleted_at` preenchido
- **THEN** o sistema MUST responder `404 Not Found` sem gravar arquivo

#### Scenario: Falha no banco não deixa arquivo órfão da requisição
- **WHEN** a gravação em `product_images` falha depois que os arquivos da foto foram gravados
- **THEN** o sistema MUST apagar os arquivos gravados por essa requisição e responder com erro

---

### Requirement: Limites de Tamanho e Formato das Imagens Enviadas
Toda rota de envio de imagem MUST aceitar somente arquivos de até 2 MiB (2.097.152 bytes) nos formatos JPEG, PNG ou WebP, identificados pelo conteúdo do arquivo e não pela extensão nem pelo `Content-Type` informado. Requisições cujo `Content-Length` já indique corpo acima do limite MUST ser recusadas sem que o corpo seja lido. Toda recusa MUST responder `400 Bad Request` no formato padrão `{ "error": "Bad Request", "message": "..." }`, sem gravar arquivo nem linha no banco.

#### Scenario: Foto acima de 2 MiB
- **WHEN** um usuário autorizado envia uma foto de 2.097.153 bytes ou mais
- **THEN** o sistema MUST responder `400 Bad Request` com mensagem que informa o tamanho enviado e o limite de 2 MB

#### Scenario: Corpo grande recusado pelo Content-Length
- **WHEN** um usuário autorizado envia uma requisição de upload com `Content-Length` de 8 MB
- **THEN** o sistema MUST responder `400 Bad Request` sem ler o corpo da requisição

#### Scenario: Formato fora da lista
- **WHEN** um usuário autorizado envia um arquivo GIF, HEIC, BMP ou AVIF
- **THEN** o sistema MUST responder `400 Bad Request` com mensagem que lista os formatos aceitos (JPEG, PNG, WebP)

#### Scenario: Arquivo de outro tipo com extensão de imagem
- **WHEN** um usuário autorizado envia um arquivo de texto chamado `foto.jpg` com `Content-Type: image/jpeg`
- **THEN** o sistema MUST responder `400 Bad Request`

#### Scenario: Imagem com dimensões excessivas
- **WHEN** um usuário autorizado envia um arquivo pequeno que declara mais de 40 megapixels
- **THEN** o sistema MUST responder `400 Bad Request` sem decodificar a imagem inteira

#### Scenario: Requisição sem arquivo ou com mais de um arquivo
- **WHEN** um usuário autorizado envia o multipart sem o campo `file` ou com mais de um arquivo
- **THEN** o sistema MUST responder `400 Bad Request` informando que cada requisição leva exatamente uma imagem

---

### Requirement: Autorização das Rotas de Escrita de Imagem
As rotas de envio e exclusão de foto e de amostra MUST exigir autenticação e papel Vendedor (`role = 2`) ou Administrador (`role = 3`), aplicando a mesma regra de escopo de `PUT /api/v1/produtos/:id`: o Administrador opera qualquer produto, e o Vendedor apenas produtos de fornecedores com vínculo ativo em `user_suppliers`. A autorização MUST ser conferida antes da leitura do arquivo enviado.

#### Scenario: Visitante sem sessão
- **WHEN** uma requisição sem cookie de sessão chama qualquer rota de escrita de imagem
- **THEN** o sistema MUST responder `401 Unauthorized`

#### Scenario: Cliente tenta enviar foto
- **WHEN** um usuário Cliente (`role = 1`) chama `POST /api/v1/produtos/:id/imagens`
- **THEN** o sistema MUST responder `403 Forbidden`

#### Scenario: Vendedor tenta operar foto de fornecedor não vinculado
- **WHEN** um Vendedor vinculado apenas ao fornecedor A envia, exclui foto ou altera amostra de um produto do fornecedor B
- **THEN** o sistema MUST responder `403 Forbidden` sem gravar arquivo nem alterar o banco

#### Scenario: Vendedor envia foto de produto do fornecedor vinculado
- **WHEN** um Vendedor vinculado ao fornecedor A envia uma foto válida para um produto do fornecedor A
- **THEN** o sistema MUST responder `201 Created`

---

### Requirement: Exclusão de Foto do Produto
O sistema MUST disponibilizar `DELETE /api/v1/produtos/:id/imagens/:imageId`, que preenche `deleted_at` na foto sem executar `DELETE` físico e sem apagar os arquivos do volume de uploads.

#### Scenario: Exclusão lógica de uma foto
- **WHEN** um usuário autorizado envia `DELETE /api/v1/produtos/:id/imagens/:imageId` de uma foto ativa do produto
- **THEN** o sistema MUST preencher `deleted_at` na foto, responder `200 OK`, omitir a foto de `GET /api/v1/produtos/:id` e manter os arquivos no volume de uploads

#### Scenario: Foto de outro produto ou já excluída
- **WHEN** um usuário autorizado envia `DELETE` com um `imageId` que não pertence ao `:id` informado ou que já tem `deleted_at`
- **THEN** o sistema MUST responder `404 Not Found`

---

### Requirement: Amostra de Textura da Variação
O sistema MUST disponibilizar `PUT /api/v1/produtos/:id/variacoes/:variationId/amostra` recebendo `multipart/form-data` com um arquivo no campo `file`, sujeito aos mesmos limites de tamanho e formato. O sistema MUST gravar a amostra em WebP com lado maior de até 512 px, sempre em arquivo novo, atualizar `product_variations.sample_image_path` e responder `200 OK` com a variação e seu `sampleImageUrl`. `DELETE` na mesma rota MUST voltar `sample_image_path` para `null`. Em nenhum dos casos o arquivo anterior é apagado do volume.

#### Scenario: Substituição da amostra gera URL nova
- **WHEN** um usuário autorizado envia uma nova amostra para uma variação que já tem amostra
- **THEN** o sistema MUST responder com um `sampleImageUrl` diferente do anterior, e o arquivo anterior MUST continuar no volume de uploads

#### Scenario: Remoção da amostra
- **WHEN** um usuário autorizado envia `DELETE /api/v1/produtos/:id/variacoes/:variationId/amostra`
- **THEN** o sistema MUST gravar `sample_image_path = NULL` e responder com `sampleImageUrl: null`

#### Scenario: Variação que não pertence ao produto
- **WHEN** um usuário autorizado envia amostra para um `variationId` inexistente, removido ou de outro produto
- **THEN** o sistema MUST responder `404 Not Found` sem gravar arquivo

---

### Requirement: Leitura Pública dos Arquivos de Imagem
O sistema MUST disponibilizar `GET /api/v1/uploads/:scope/:ownerId/:file` sem autenticação, aceitando apenas `scope` igual a `products` ou `variations`, `ownerId` em formato UUID e `file` no padrão de nome gerado pelo servidor. O arquivo MUST ser servido com `Content-Type: image/webp`, `Cache-Control: public, max-age=31536000, immutable` e `X-Content-Type-Options: nosniff`. A rota MUST servir o arquivo enquanto ele existir no volume, inclusive de foto, variação ou produto excluídos logicamente.

#### Scenario: Leitura de uma miniatura
- **WHEN** um visitante chama o `thumbnailUrl` devolvido pela API
- **THEN** o sistema MUST responder `200 OK` com o conteúdo WebP e os cabeçalhos de cache imutável e `nosniff`

#### Scenario: Caminho fora do padrão
- **WHEN** um visitante chama `/api/v1/uploads/` com escopo desconhecido, `ownerId` que não é UUID, nome fora do padrão ou segmentos como `..` ou `%2e%2e%2f`
- **THEN** o sistema MUST responder `404 Not Found` sem acessar arquivos fora do diretório de uploads

#### Scenario: Arquivo inexistente
- **WHEN** um visitante chama um caminho no padrão válido cujo arquivo não existe no volume
- **THEN** o sistema MUST responder `404 Not Found`

#### Scenario: Foto excluída continua acessível pela URL
- **WHEN** uma foto recebe soft delete e alguém chama a `fullImageUrl` que ela tinha
- **THEN** o sistema MUST continuar servindo o arquivo com `200 OK`

---

### Requirement: Backup e Restauração do Volume de Uploads
O script `scripts/backup.sh` MUST gerar, numa mesma execução e com o mesmo timestamp, o dump do banco (`backup_<banco>_<timestamp>.sql.gz`) e, depois dele, um arquivo `uploads_<timestamp>.tar.gz` com o conteúdo do diretório de uploads do backend, aplicando a retenção de 30 dias aos dois. O script `scripts/restore.sh` MUST restaurar o banco e os arquivos a partir de um timestamp.

#### Scenario: Backup gera banco e fotos com o mesmo timestamp
- **WHEN** o operador executa `./scripts/backup.sh` com os containers de produção no ar
- **THEN** o diretório `backups/` MUST conter um `.sql.gz` e um `uploads_*.tar.gz` com o mesmo timestamp, e todo caminho de imagem registrado no dump MUST ter o arquivo correspondente no `.tar.gz`

#### Scenario: Restauração pelo timestamp
- **WHEN** o operador executa `./scripts/restore.sh <timestamp>` e confirma a operação
- **THEN** o banco MUST ser restaurado a partir do `.sql.gz` e o diretório de uploads a partir do `uploads_<timestamp>.tar.gz` do mesmo timestamp

#### Scenario: Fotos sobrevivem a novo deploy
- **WHEN** os containers de produção são recriados pelo `deploy.sh` depois de fotos enviadas
- **THEN** as URLs das fotos MUST continuar respondendo `200 OK`
