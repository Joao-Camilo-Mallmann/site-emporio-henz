## ADDED Requirements

### Requirement: Persistência Relacional de Categorias e Subtipos no Banco de Dados
O sistema SHALL criar e manter as tabelas `categories` e `product_subtypes` no PostgreSQL com suporte a soft delete (`deleted_at`), chaves estrangeiras com `ON DELETE RESTRICT`, e índices parciais únicos de `slug` ativos (`WHERE deleted_at IS NULL`).

#### Scenario: Aplicação de migração e índices únicos ativos
- **WHEN** o runner de migrações executar os arquivos `008_create_categories.sql` e `009_create_product_subtypes.sql`
- **THEN** as tabelas `categories` e `product_subtypes` são criadas com coluna `deleted_at` e índices parciais de unicidade ativa no campo `slug`

#### Scenario: Povoamento inicial idempotente via seed
- **WHEN** o script de seed for executado
- **THEN** os 6 ambientes oficiais (`quarto`, `sala-de-estar`, `sala-de-jantar`, `cozinha`, `escritorio`, `banheiro`) e seus respectivos subtipos são inseridos sem gerar duplicidade em execuções repetidas

### Requirement: Listagem Pública da Hierarquia de Categorias e Subtipos
O sistema SHALL disponibilizar o endpoint público `GET /api/v1/categorias` retornando a lista de categorias ativas com seus respectivos subtipos ativos aninhados em formato JSON limpo.

#### Scenario: Consulta pública por visitante deslogado
- **WHEN** uma requisição HTTP `GET /api/v1/categorias` for enviada sem token de autenticação e sem parâmetros de paginação
- **THEN** o sistema responde com status `200 OK` e um array de categorias contendo a propriedade `subtypes` com os subtipos ativos vinculados

#### Scenario: Listagem paginada pública de categorias
- **WHEN** uma requisição HTTP `GET /api/v1/categorias?page=1&limit=10` for enviada sem token de Administrador
- **THEN** o sistema responde com status `200 OK`, a lista paginada contendo somente categorias ativas e os metadados de paginação (page, limit, total, totalPages), ignorando o filtro `active`

#### Scenario: Listagem paginada de categorias para gestão administrativa
- **WHEN** um Administrador autenticado enviar `GET /api/v1/categorias?page=1&limit=10`
- **THEN** o sistema inclui categorias inativas na lista paginada e aplica o filtro `active` quando informado

### Requirement: Visibilidade Pública Restrita a Registros Ativos
O sistema SHALL ocultar categorias e subtipos inativos de todas as leituras feitas sem token de Administrador, tratando token ausente, inválido ou de outro perfil como visitante anônimo. Um subtipo SHALL ser considerado visível ao público somente quando ele e sua categoria estiverem ativos.

#### Scenario: Consulta por ID de registro inativo sem privilégio
- **WHEN** um visitante, Cliente ou Vendedor enviar `GET /api/v1/categorias/:id` ou `GET /api/v1/subtipos/:id` para um registro inativo, ou para um subtipo de categoria inativa
- **THEN** o sistema responde com status `404 Not Found`

#### Scenario: Consulta por ID de registro inativo pelo Administrador
- **WHEN** um Administrador autenticado enviar a mesma requisição
- **THEN** o sistema responde com status `200 OK` e o registro inativo

#### Scenario: Listagem pública de subtipos
- **WHEN** uma requisição `GET /api/v1/subtipos` for enviada sem token de Administrador
- **THEN** o sistema retorna somente subtipos ativos cuja categoria também está ativa

### Requirement: Validação de Entrada e Respostas de Erro sem Detalhes Internos
O sistema SHALL validar identificadores, paginação e tamanhos de texto antes de consultar o banco, e SHALL responder falhas internas com mensagem genérica, sem expor mensagens do driver, nomes de constraints ou detalhes do esquema.

#### Scenario: Identificador de rota inválido
- **WHEN** `:id` não for um UUID válido em `GET`, `PUT` ou `DELETE` de `/api/v1/categorias/:id` ou `/api/v1/subtipos/:id`
- **THEN** o sistema responde com status `400 Bad Request` sem executar consulta no banco

#### Scenario: Parâmetros de paginação fora dos limites
- **WHEN** `page` não for um inteiro entre 1 e 10000, ou `limit` não for um inteiro entre 1 e 100
- **THEN** o sistema usa os valores padrão (`page = 1`, `limit = 20`) e responde `200 OK`

#### Scenario: Termo de busca longo
- **WHEN** `search` tiver mais de 100 caracteres
- **THEN** o sistema considera somente os 100 primeiros caracteres

#### Scenario: Nome ou slug acima do limite da coluna
- **WHEN** o payload de criação ou atualização contiver `name` ou `slug` com mais de 255 caracteres
- **THEN** o sistema rejeita a operação com status `400 Bad Request`

#### Scenario: Colisão de slug em requisições concorrentes
- **WHEN** duas requisições simultâneas tentarem gravar o mesmo slug e a segunda violar o índice único
- **THEN** o sistema responde à segunda com status `409 Conflict`

#### Scenario: Falha interna não tratada
- **WHEN** ocorrer um erro não previsto durante o processamento
- **THEN** o sistema responde com status `500` e mensagem genérica, registrando o detalhe apenas no log do servidor

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

### Requirement: Gerenciamento de Subtipos com Validação, Listagem Paginada e Soft Delete
O sistema SHALL disponibilizar os endpoints `GET /api/v1/subtipos` (público com suporte a paginação e filtros), `POST /api/v1/subtipos`, `PUT /api/v1/subtipos/:id` e `DELETE /api/v1/subtipos/:id` restritos ao Administrador para controle das tipologias de móveis vinculadas a uma `category_id`.

#### Scenario: Listagem paginada de subtipos
- **WHEN** uma requisição HTTP `GET /api/v1/subtipos?page=1&limit=20` for enviada com ou sem filtros de categoria ou busca
- **THEN** o sistema responde com status `200 OK` e o objeto contendo o array `data` (restrito a registros visíveis ao público quando não houver token de Administrador) e o objeto `pagination` com `page`, `limit`, `total` e `totalPages`

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
