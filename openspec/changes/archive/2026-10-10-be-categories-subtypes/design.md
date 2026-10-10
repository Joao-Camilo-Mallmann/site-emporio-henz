## Context

O sistema Empório Henz necessita de uma estrutura robusta de categorização para que o catálogo de móveis seja classificado em ambientes da casa (categorias principais, ex.: Sala de Estar, Quarto, Cozinha) e tipologias de móveis (subtipos, ex.: Sofá, Roupeiro, Cama), atendendo ao requisito RF04 do PRD.
Atualmente, as tabelas `categories` e `product_subtypes` estão previstas conceitualmente em `docs/database/diagram.mmd`, mas não existem no PostgreSQL (as migrações param na 007). Além disso, não há endpoints nem coleções do Bruno para operar essas entidades no backend Bun.

## Goals / Non-Goals

**Goals:**
- Implementar migrações SQL `008_create_categories.sql` e `009_create_product_subtypes.sql` com integridade referencial (`ON DELETE RESTRICT`), colunas `deleted_at` e índices parciais de unicidade ativa (`WHERE deleted_at IS NULL`).
- Implementar seed idempotente em `backend/database/seed.ts` povoando os 6 ambientes oficiais do frontend (`quarto`, `sala-de-estar`, `sala-de-jantar`, `cozinha`, `escritorio`, `banheiro`) e seus subtipos correspondentes.
- Criar os módulos desacoplados `backend/src/modules/categories/` e `backend/src/modules/subtypes/` seguindo a arquitetura em camadas do projeto (controller, service, repository, schema, routes, types) e utilitário compartilhado `backend/src/lib/slug.ts`.
- Expor `GET /api/v1/categorias` como rota pública entregando a hierarquia completa de categorias com subtipos ativos em JSON limpo ou resultado paginado mediante query params (`page`, `limit`, `search`).
- Expor `GET /api/v1/subtipos` como rota pública entregando listagem paginada de subtipos com suporte a filtros combinados por `categoryId`, `search` e `active`.
- Expor rotas de mutação protegidas exclusivas para Admin (`role = 3`): `POST /api/v1/categorias`, `PUT /api/v1/categorias/:id`, `DELETE /api/v1/categorias/:id`, `POST /api/v1/subtipos`, `PUT /api/v1/subtipos/:id`, `DELETE /api/v1/subtipos/:id`.
- Garantir geração automática e validação rigorosa de slugs únicos ativos na criação e em updates (ignorando o próprio ID em atualizações e retornando 409 se colidir com outro ativo).
- Implementar exclusão lógica em cascata: ao deletar categoria, preencher atomicamente `deleted_at` em todos os seus subtipos vinculados.
- Criar a coleção Bruno em `docs/backend/collections/bruno/Categories/` e `docs/backend/collections/bruno/Subtypes/`.

**Non-Goals:**
- Telas ou componentes visuais de frontend (foco estrito no backend, banco de dados e testes/documentação no Bruno).
- CRUD de produtos ou vinculação de produtos físicos aos subtipos (escopo da história seguinte `US-BE-09`).

## Decisions

### 1. Migração Relacional e Integridade Física vs Lógica
- **Decisão**: A chave estrangeira `product_subtypes.category_id` usará `ON DELETE RESTRICT` no banco de dados.
- **Alternativa Rejeitada**: `ON DELETE CASCADE` físico foi descartado para respeitar rigorosamente o RNF08 (proibição de deleção física). A cascata de exclusão é puramente lógica via query SQL atômica no service.

### 2. Geração e Validação de Slugs
- **Decisão**: O `slug` é opcional no payload de criação. Se omitido, é gerado automaticamente pelo utilitário `slugify(name)`. Se enviado (ou recalculado no PUT), é validado contra o banco. Em updates, valida-se unicidade com `WHERE slug = :slug AND id != :id AND deleted_at IS NULL`.
- **Alternativa Rejeitada**: Exigir slug obrigatório do cliente transferiria responsabilidade desnecessária e aumentaria atrito na integração.

### 3. Hierarquia no Endpoint Público `GET /api/v1/categorias`
- **Decisão**: Realizar a busca de categorias ativas e de subtipos ativos e montar em memória no repositório/serviço a árvore `{ ...category, subtypes: [...] }`, evitando queries N+1.
- **Alternativa Rejeitada**: Retornar apenas categorias e exigir que o frontend faça 1 requisição extra para cada categoria buscar subtipos geraria overhead de rede.

### 4. Permissões de Acesso (RBAC)
- **Decisão**: `GET /api/v1/categorias` é público para permitir carregamento rápido do catálogo por qualquer visitante. Todas as mutações (`POST`, `PUT`, `DELETE`) passam pelos middlewares `authMiddleware` e `requireRole(ROLES.ADMIN)`.
- **Alternativa Rejeitada**: Exigir token em `GET` quebraria a navegação de visitantes deslogados no e-commerce.

### 5. Visibilidade de Registros Inativos nas Leituras Públicas
- **Decisão**: As rotas `GET` de categorias e subtipos passam por `attachUserIfAuthenticated`, que anexa o usuário quando o token é válido e nunca bloqueia. Os services recebem `includeInactive`, verdadeiro apenas para Administrador; sem ele, forçam `active = true` e, em subtipos, exigem também a categoria ativa.
- **Alternativa Rejeitada**: Criar rotas administrativas separadas duplicaria controllers e a collection para o mesmo recurso. Confiar no parâmetro `active` da query deixaria qualquer visitante listar registros desativados.

### 6. Validação de Entrada e Erros Internos
- **Decisão**: `:id` é validado como UUID no controller (`400`). Paginação e busca usam `backend/src/lib/pagination.ts`, com fallback para os padrões quando fora dos limites. `name` e `slug` são limitados a 255 caracteres no schema. A violação do índice único (SQLSTATE `23505`) é convertida em `ConflictError` no service, cobrindo a corrida entre a checagem prévia e a escrita. O `errorHandler` global responde `500` com mensagem genérica e mantém o detalhe apenas no log.
- **Alternativa Rejeitada**: Remover a checagem prévia de slug e depender só do índice economizaria uma consulta, mas a mensagem de conflito continuaria a mesma e os testes de serviço perderiam o caminho sem banco.

## Risks / Trade-offs

- **[Colisão de Slug após Soft Delete]** → *Mitigação*: Os índices únicos usam a cláusula parcial `WHERE deleted_at IS NULL`. Isso permite que um slug anteriormente desativado possa ser recadastrado no futuro sem violação de unicidade.
- **[Cascata lógica inconsistente]** → *Mitigação*: A desativação da categoria e a marcação de seus subtipos filhos ocorrem dentro de uma transação SQL gerenciada por `sql.begin()`.
- **[Corrida na unicidade do slug]** → *Mitigação*: O índice único parcial é a garantia final; o service converte a violação em `409 Conflict`.
