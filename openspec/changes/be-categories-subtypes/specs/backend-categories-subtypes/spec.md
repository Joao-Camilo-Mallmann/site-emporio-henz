## ADDED Requirements

### Requirement: Persistência Relacional de Categorias e Subtipos no Banco de Dados
O sistema SHALL criar e manter as tabelas `categories` e `product_subtypes` no PostgreSQL com suporte a soft delete (`deleted_at`), chaves estrangeiras com `ON DELETE RESTRICT`, e índices parciais únicos de `slug` ativos (`WHERE deleted_at IS NULL`).

#### Scenario: Aplicação de migração e índices únicos ativos
- **WHEN** o runner de migrações executar o arquivo `008_create_categories_and_subtypes.sql`
- **THEN** as tabelas `categories` e `product_subtypes` são criadas com coluna `deleted_at` e índices parciais de unicidade ativa no campo `slug`

#### Scenario: Povoamento inicial idempotente via seed
- **WHEN** o script de seed for executado
- **THEN** os 6 ambientes oficiais (`quarto`, `sala-de-estar`, `sala-de-jantar`, `cozinha`, `escritorio`, `banheiro`) e seus respectivos subtipos são inseridos sem gerar duplicidade em execuções repetidas

### Requirement: Listagem Pública da Hierarquia de Categorias e Subtipos
O sistema SHALL disponibilizar o endpoint público `GET /api/v1/categorias` retornando a lista de categorias ativas com seus respectivos subtipos ativos aninhados em formato JSON limpo.

#### Scenario: Consulta pública por visitante deslogado
- **WHEN** uma requisição HTTP `GET /api/v1/categorias` for enviada sem token de autenticação
- **THEN** o sistema responde com status `200 OK` e um array de categorias contendo a propriedade `subtypes` com os subtipos ativos vinculados

### Requirement: Cadastro de Categoria Principal com Validação de Slug e RBAC
O sistema SHALL disponibilizar o endpoint `POST /api/v1/categorias` restrito ao Administrador para criação de novas categorias principais, gerando o slug automaticamente se omitido e validando a unicidade ativa do slug.

#### Scenario: Criação de categoria por Administrador com slug automático
- **WHEN** um usuário autenticado com perfil Administrador (`role = 3`) enviar `POST /api/v1/categorias` com `{"name": "Área Externa"}`
- **THEN** o sistema gera o slug `area-externa`, persiste no banco e retorna status `201 Created`

#### Scenario: Bloqueio de slug duplicado entre registros ativos
- **WHEN** o payload contiver um slug que já existe em outra categoria com `deleted_at IS NULL`
- **THEN** o sistema rejeita a operação com status `409 Conflict`

#### Scenario: Bloqueio de usuário não administrador
- **WHEN** um usuário com perfil Cliente (`role = 1`) ou Vendedor (`role = 2`) tentar criar categoria
- **THEN** o sistema rejeita a requisição com status `403 Forbidden`

### Requirement: Atualização de Categoria Principal com Validação Estrita de Slug
O sistema SHALL disponibilizar o endpoint `PUT /api/v1/categorias/:id` restrito ao Administrador para atualizar campos da categoria, validando unicidade de slug contra outros registros ativos.

#### Scenario: Atualização com slug inalterado ou único
- **WHEN** o Administrador enviar `PUT /api/v1/categorias/:id` com novos dados e o slug for mantido ou não colidir com outra categoria ativa
- **THEN** o sistema atualiza a categoria e responde com status `200 OK`

#### Scenario: Atualização com colisão de slug em outra categoria
- **WHEN** o Administrador tentar atualizar uma categoria informando um slug já utilizado por outra categoria ativa diferente
- **THEN** o sistema rejeita a atualização com status `409 Conflict`

### Requirement: Soft Delete de Categoria com Cascata Lógica em Subtipos
O sistema SHALL disponibilizar o endpoint `DELETE /api/v1/categorias/:id` restrito ao Administrador que aplica exclusão lógica preenchendo `deleted_at = CURRENT_TIMESTAMP` na categoria e atomicamente em todos os seus subtipos vinculados.

#### Scenario: Exclusão lógica com cascata em subtipos ativos
- **WHEN** o Administrador enviar `DELETE /api/v1/categorias/:id` para uma categoria existente
- **THEN** a categoria tem seu campo `deleted_at` preenchido e todos os subtipos ativos vinculados a ela também têm `deleted_at` preenchido em transação SQL, sem nenhum `DELETE` físico

### Requirement: Gerenciamento de Subtipos com Validação e Soft Delete
O sistema SHALL disponibilizar os endpoints `POST /api/v1/subtipos`, `PUT /api/v1/subtipos/:id` e `DELETE /api/subtipos/:id` restritos ao Administrador para controle das tipologias de móveis vinculadas a uma `category_id`.

#### Scenario: Criação de subtipo vinculado a categoria existente
- **WHEN** o Administrador enviar `POST /api/v1/subtipos` com `{"categoryId": "<uuid>", "name": "Banqueta"}`
- **THEN** o sistema valida a existência da categoria ativa, gera o slug e retorna `201 Created`

#### Scenario: Atualização de subtipo com validação de unicidade de slug
- **WHEN** o Administrador enviar `PUT /api/v1/subtipos/:id` com novo nome ou slug
- **THEN** o sistema valida que o slug não colide com outro subtipo ativo diferente e retorna `200 OK`

#### Scenario: Soft delete individual de subtipo
- **WHEN** o Administrador enviar `DELETE /api/v1/subtipos/:id`
- **THEN** o sistema preenche `deleted_at = CURRENT_TIMESTAMP` no subtipo e retorna `200 OK`

### Requirement: Documentação Interativa das Rotas no Bruno
O sistema SHALL disponibilizar arquivos de teste e documentação `.bru` na collection Bruno sob `docs/backend/collections/bruno/Categories/` e `docs/backend/collections/bruno/Subtypes/`.

#### Scenario: Teste das rotas via arquivos Bruno
- **WHEN** um desenvolvedor abrir a pasta da coleção Bruno
- **THEN** encontra requisições configuradas para listagem pública e operações administrativas com token de autenticação e exemplos de payload válidos
