## Context

O sistema Empório Henz necessita de uma estrutura robusta de categorização para que o catálogo de móveis seja classificado em ambientes da casa (categorias principais, ex.: Sala de Estar, Quarto, Cozinha) e tipologias de móveis (subtipos, ex.: Sofá, Roupeiro, Cama), atendendo ao requisito RF04 do PRD.
Atualmente, as tabelas `categories` e `product_subtypes` estão previstas conceitualmente em `docs/database/diagram.mmd`, mas não existem no PostgreSQL (as migrações param na 007). Além disso, não há endpoints nem coleções do Bruno para operar essas entidades no backend Bun.

## Goals / Non-Goals

**Goals:**
- Implementar migração SQL `008_create_categories_and_subtypes.sql` com integridade referencial (`ON DELETE RESTRICT`), colunas `deleted_at` e índices parciais de unicidade ativa (`WHERE deleted_at IS NULL`).
- Implementar seed idempotente em `backend/database/seed.ts` povoando os 6 ambientes oficiais do frontend (`quarto`, `sala-de-estar`, `sala-de-jantar`, `cozinha`, `escritorio`, `banheiro`) e seus subtipos correspondentes.
- Criar o módulo `backend/src/modules/categories/` seguindo a arquitetura em camadas do projeto (controller, service, repository, schema, routes, types).
- Expor `GET /api/v1/categorias` como rota pública que entrega a hierarquia aninhada de categorias e subtipos ativos em JSON limpo.
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

## Risks / Trade-offs

- **[Colisão de Slug após Soft Delete]** → *Mitigação*: Os índices únicos usam a cláusula parcial `WHERE deleted_at IS NULL`. Isso permite que um slug anteriormente desativado possa ser recadastrado no futuro sem violação de unicidade.
- **[Cascata lógica inconsistente]** → *Mitigação*: A desativação da categoria e a marcação de seus subtipos filhos ocorrem dentro de uma transação SQL gerenciada por `sql.begin()`.
