# Capability: backend-products-crud

## Purpose
Operações completas de banco de dados e API REST para persistência e gestão do catálogo de produtos, variações e metadados de imagens com suporte a multi-empresa e regras de negócio de disponibilidade.

## Requirements

### Requirement: Persistência Relacional do Domínio de Produtos (Database First)
O banco de dados PostgreSQL MUST conter as tabelas \`products\`, \`product_variations\` e \`product_images\` criadas por migrações versionadas (\`010_create_products.sql\`, \`011_create_product_variations.sql\`, \`012_create_product_images.sql\`), com chaves estrangeiras \`ON DELETE RESTRICT\`, suporte a exclusão lógica (\`deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL\`) e índice único parcial \`idx_products_slug_active ON products (slug) WHERE deleted_at IS NULL\`.

#### Scenario: Execução das migrações de produtos em banco limpo e de forma idempotente
- **WHEN** o runner de migrações (\`bun run migrate\`) for executado
- **THEN** as tabelas \`products\`, \`product_variations\` e \`product_images\` e seus índices parciais MUST ser criados sem erros e uma segunda execução consecutiva MUST encerrar com zero migrações pendentes

#### Scenario: Reuso de slug de produto após soft delete
- **WHEN** um produto ativo com slug \`roupeiro-roma\` receber soft delete (\`deleted_at IS NOT NULL\`) e um novo produto for cadastrado com o mesmo slug \`roupeiro-roma\`
- **THEN** o banco de dados MUST permitir a inserção sem violação de unicidade graças ao índice parcial \`WHERE deleted_at IS NULL\`

---

### Requirement: Criação de Produto com Dimensões, Disponibilidade, Especificações JSONB e Variações
O sistema MUST disponibilizar o endpoint \`POST /api/v1/produtos\` restrito a usuários autenticados com papel Vendedor (\`role = 2\`) ou Administrador (\`role = 3\`), validando dimensões obrigatórias em milímetros (\`heightMm\`, \`widthMm\`, \`depthMm\` inteiros \`> 0\`), disponibilidade (\`IN_STOCK\` ou \`ON_DEMAND\`), integridade de \`categoryId\`, \`subtypeId\` (opcional, devendo pertencer à categoria informada) e \`supplierId\`, especificações \`JSONB\` e variações opcionais.

#### Scenario: Cadastro de produto sob encomenda com dimensões e variações por Administrador
- **WHEN** um Administrador envia \`POST /api/v1/produtos\` com dados válidos, \`availabilityType: "ON_DEMAND"\`, \`estimatedDays: 15\`, dimensões em milímetros (\`heightMm: 2200\`, \`widthMm: 1800\`, \`depthMm: 600\`), \`specifications\` em JSON e array \`variations\`
- **THEN** o sistema MUST persistir o produto e suas variações em transação e retornar status \`201 Created\` com os dados completos do produto criado

#### Scenario: Normalização de prazo para produto a pronta entrega (IN_STOCK)
- **WHEN** um usuário autorizado envia \`POST /api/v1/produtos\` com \`availabilityType: "IN_STOCK"\` sem informar \`estimatedDays\` (ou informando qualquer valor)
- **THEN** o sistema MUST normalizar e persistir \`estimatedDays\` como \`0\`

#### Scenario: Rejeição de produto sob encomenda sem prazo estimado válido
- **WHEN** um usuário autorizado envia \`POST /api/v1/produtos\` com \`availabilityType: "ON_DEMAND"\` e \`estimatedDays\` ausente ou menor que \`1\`
- **THEN** o sistema MUST rejeitar a requisição com status \`400 Bad Request\`

#### Scenario: Rejeição quando subtipo não pertence à categoria informada
- **WHEN** um usuário autorizado envia \`POST /api/v1/produtos\` informando um \`subtypeId\` cujo \`category_id\` difere do \`categoryId\` enviado
- **THEN** o sistema MUST rejeitar a requisição com status \`400 Bad Request\`

---

### Requirement: Isolamento Multi-Empresa e Escopo por Fornecedor para Vendedores
O backend MUST validar estritamente em todas as operações de \`/api/v1/produtos\` se o usuário com papel Vendedor (\`role = 2\`) possui vínculo ativo em \`user_suppliers\` (\`deleted_at IS NULL\`) com o fornecedor alvo, retornando \`403 Forbidden\` em qualquer violação de escopo.

#### Scenario: Vendedor sem empresa vinculada tenta cadastrar ou listar produtos
- **WHEN** um Vendedor que não possui nenhum vínculo ativo em \`user_suppliers\` envia requisição para \`GET /api/v1/produtos\` ou \`POST /api/v1/produtos\`
- **THEN** o sistema MUST bloquear a operação e retornar status \`403 Forbidden\`

#### Scenario: Vendedor vinculado à Empresa A cadastra produto para a Empresa A
- **WHEN** um Vendedor ativamente vinculado ao fornecedor A envia \`POST /api/v1/produtos\` com \`supplierId\` do fornecedor A
- **THEN** o sistema MUST permitir a criação e retornar status \`201 Created\`

#### Scenario: Vendedor vinculado à Empresa A tenta cadastrar, consultar, editar ou excluir produto da Empresa B
- **WHEN** um Vendedor vinculado apenas ao fornecedor A tenta enviar \`POST /api/v1/produtos\` com \`supplierId\` do fornecedor B, ou tenta chamar \`GET /api/v1/produtos/:id\`, \`PUT /api/v1/produtos/:id\` ou \`DELETE /api/v1/produtos/:id\` de um produto pertencente ao fornecedor B
- **THEN** o sistema MUST rejeitar a operação com status \`403 Forbidden\`

---

### Requirement: Listagem Paginada e Consulta Detalhada de Produtos
O sistema MUST disponibilizar `GET /api/v1/produtos` com paginação padronizada (`{ data, pagination }`) e filtros combinados (`categoryId`, `subtypeId`, `supplierId`, `availabilityType`, `active`, `search`), e `GET /api/v1/produtos/:id` retornando todos os dados do produto, suas `variations`, suas `images` ordenadas por `sort_order`, e os objetos aninhados `category` (`{ id, name, slug }`) e `supplier` (`{ id, name }`) sem valores nulos, preservando os campos escalares `categoryId`, `subtypeId` e `supplierId`.

#### Scenario: Listagem filtrada automaticamente pelos fornecedores do Vendedor
- **WHEN** um Vendedor vinculado aos fornecedores A e B chama `GET /api/v1/produtos`
- **THEN** o sistema MUST retornar no envelope paginado exclusivamente os produtos pertencentes aos fornecedores A e B, ocultando produtos de outros fornecedores

#### Scenario: Visitante ou Cliente consulta listagem e detalhes de produtos
- **WHEN** um visitante anônimo ou usuário Cliente (`role = 1`) chama `GET /api/v1/produtos` ou `GET /api/v1/produtos/:id`
- **THEN** o sistema MUST retornar apenas produtos com `active = true` e `deleted_at IS NULL` (retornando `404 Not Found` em `GET /:id` se o produto estiver inativo ou deletado)

#### Scenario: Detalhe do produto retorna objetos aninhados de categoria e fornecedor
- **WHEN** um usuário autorizado ou visitante consulta um produto ativo via `GET /api/v1/produtos/:id`
- **THEN** a resposta 200 MUST conter o objeto `category` com `{ id, name, slug }`, o objeto `supplier` com `{ id, name }`, as fotos em `images` ordenadas por `sort_order`, as variações em `variations` com cores e amostras, e o objeto JSONB `specifications`, mantendo `categoryId`, `subtypeId` e `supplierId`

#### Scenario: Identificador inválido na consulta por ID
- **WHEN** uma requisição para `GET /api/v1/produtos/:id` contiver um identificador que não seja um UUID válido
- **THEN** o sistema MUST retornar status `400 Bad Request` com mensagem informativa

### Requirement: Atualização de Produto com Sincronização de Variações e Soft Delete
O sistema MUST permitir atualizar dados cadastrais e variações via \`PUT /api/v1/produtos/:id\` (preservando os UUIDs de variações existentes informadas por \`id\`, inserindo novas sem \`id\` e aplicando soft delete nas omitidas) e desativar produtos via \`DELETE /api/v1/produtos/:id\` preenchendo \`deleted_at = CURRENT_TIMESTAMP\` sem executar \`DELETE\` físico.

#### Scenario: Sincronização de variações no PUT preservando IDs existentes
- **WHEN** um usuário autorizado envia \`PUT /api/v1/produtos/:id\` contendo um array \`variations\` com uma variação existente (com \`id\`) editada, uma nova variação (sem \`id\`) e omitindo uma variação antiga
- **THEN** o sistema MUST atualizar a variação existente mantendo seu \`id\`, inserir a nova variação e preencher \`deleted_at\` na variação omitida

#### Scenario: Soft delete de produto oculta o registro imediatamente
- **WHEN** um usuário autorizado envia \`DELETE /api/v1/produtos/:id\`
- **THEN** o sistema MUST preencher \`deleted_at\` no produto (e em suas variações e imagens vinculadas) sem remover linhas fisicamente do banco, e chamadas subsequentes a \`GET /api/v1/produtos\` ou \`GET /api/v1/produtos/:id\` NÃO MUST retornar o produto desativado

---

### Requirement: Imagens Armazenadas como Arquivo, com Caminho no Banco
O banco MUST guardar apenas o caminho relativo dos arquivos de imagem (\`product_images.thumbnail_path\`, \`product_images.full_image_path\` e \`product_variations.sample_image_path\`, em \`VARCHAR(255)\`), sem nenhuma coluna de conteúdo de imagem ou Base64. Os arquivos ficam no diretório de uploads do backend, que em produção é o volume Docker \`uploads_data\` da VM, e as respostas da API MUST expor somente URLs.

#### Scenario: Detalhe do produto expõe URLs de imagem, não conteúdo
- **WHEN** \`GET /api/v1/produtos/:id\` retorna um produto com imagens e variações
- **THEN** cada item de \`images\` MUST trazer \`thumbnailUrl\` e \`fullImageUrl\`, e cada variação MUST trazer \`sampleImageUrl\` (ou \`null\` sem amostra), todos no formato \`/api/v1/uploads/<caminho relativo>\` e sem conteúdo de imagem no JSON

#### Scenario: JSON do CRUD não grava imagem
- **WHEN** um usuário autorizado envia \`POST /api/v1/produtos\` ou \`PUT /api/v1/produtos/:id\` com um campo de imagem dentro de \`variations\` (ex.: \`sampleImageBase64\`)
- **THEN** o sistema MUST descartar o campo na validação e não gravar conteúdo de imagem no banco

#### Scenario: Edição de variações preserva a amostra já enviada
- **WHEN** um usuário autorizado envia \`PUT /api/v1/produtos/:id\` atualizando uma variação existente pelo \`id\`
- **THEN** o \`sample_image_path\` dessa variação MUST permanecer inalterado, pois a amostra só muda pelo upload de arquivo da US-BE-10

#### Scenario: Arquivos persistem entre deploys
- **WHEN** os containers de produção são recriados pelo \`deploy.sh\`
- **THEN** o diretório \`/app/uploads\` do backend MUST manter os arquivos, por estar montado no volume nomeado \`uploads_data\`
