## Context

A história **[US-BE-09]** implementa o CRUD de produtos com escopo por fornecedor, dimensões estruturadas em milímetros, especificações em `JSONB`, variações de acabamento e regras de disponibilidade (`IN_STOCK` / `ON_DEMAND`), atendendo aos requisitos **RF02**, **RF03**, **RF16**, **RF17**, **RF19**, **RNF08**, **RNF09** e **RNF11** do PRD.

Atualmente:
- As migrações do PostgreSQL em `backend/database/migrations/` vão apenas até `009_create_product_subtypes.sql`. As tabelas `products`, `product_variations` e `product_images` previstas no DER do PRD ainda não existem no banco.
- O módulo `backend/src/modules/products/` contém apenas a lógica e a rota pública de recomendações (`GET /api/v1/produtos/:id/recomendados` da `US-BE-15`).

Seguindo a diretriz **Database First (`[DB]` → `[BE]`)**, este design cria as migrações `010`, `011` e `012` e constrói o módulo completo de produtos já preparado para as próximas entregas (`US-BE-10` de upload das imagens para o volume de uploads e `US-FE-08` do formulário administrativo).

## Goals / Non-Goals

**Goals:**
- Criar as migrações SQL `010_create_products.sql`, `011_create_product_variations.sql` e `012_create_product_images.sql` com integridade referencial (`ON DELETE RESTRICT`), colunas `deleted_at` e índice único parcial `idx_products_slug_active WHERE deleted_at IS NULL`.
- Implementar os endpoints REST em `backend/src/modules/products/`:
  - `GET /api/v1/produtos`: Listagem paginada (`{ data, pagination }`) com filtros por `active` (`status`), `supplierId`, `categoryId`, `subtypeId`, `availabilityType` e `search`.
  - `GET /api/v1/produtos/:id`: Retorno detalhado do produto com os arrays `variations` e `images` ordenados por `sort_order`.
  - `POST /api/v1/produtos`: Criação transacional de produto (e variações opcionais) com validação de escopo multi-empresa.
  - `PUT /api/v1/produtos/:id`: Atualização de dados cadastrais e sincronização de `variations` preservando IDs existentes.
  - `DELETE /api/v1/produtos/:id`: Soft delete transacional do produto e cascata lógica nas suas variações e imagens.
- Garantir a matriz de autorização e isolamento multi-empresa (`user_suppliers`) para `ROLES.SELLER (2)` com retorno estrito `403 Forbidden` em qualquer violação de escopo.
- Preservar integralmente o contrato existente de `GET /api/v1/produtos/:id/recomendados` e seus testes unitários.
- Guardar no banco só o caminho das imagens (`thumbnail_path`, `full_image_path`, `sample_image_path`) e expor URLs na API, com os arquivos no volume Docker `uploads_data` da VM.
- Documentar as rotas na collection Bruno (`docs/backend/collections/bruno/Products/`) e o fluxograma de autorização em `docs/PRD.md` e `docs/backend/README.md`.

**Non-Goals:**
- Upload, validação, geração de miniatura, rota de leitura e backup dos arquivos de imagem (escopo da `US-BE-10`).
- Componentes ou telas de frontend Vue (`US-FE-08`).

## Decisions

### 1. Fundação Database First Completa (`010`, `011`, `012`)
- **Decisão**: Criar as 3 tabelas do agregado de produto (`products`, `product_variations`, `product_images`) com `ON DELETE RESTRICT` nas FKs obrigatórias (`category_id`, `supplier_id`, `product_id`) e opcionais (`subtype_id`, `variation_id`).
- **Alternativa Rejeitada**: Criar apenas `010_create_products.sql` agora impediria `GET /api/v1/produtos/:id` de retornar `variations` e `images` conforme especificado na `US-BE-09` e exigiria refatorar as queries de detalhe e soft delete na `US-BE-10`.

### 2. Matriz de Autorização e Escopo por Papel em `/api/v1/produtos`
- **Decisão**: As rotas de leitura (`GET /` e `GET /:id`) utilizam `attachUserIfAuthenticated` e as rotas de escrita (`POST /`, `PUT /:id`, `DELETE /:id`) utilizam `authMiddleware` + `requireRole(ROLES.SELLER, ROLES.ADMIN)`, aplicando a seguinte árvore de decisão no serviço:

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

- **Alternativa Rejeitada**: Bloquear visitantes em `GET /api/v1/produtos` exigiria duplicar handlers de leitura quando o catálogo público consumir a rota; permitir que um Vendedor visualize ou filtre produtos de fornecedores não vinculados violaria o isolamento multi-empresa do **RF19** e **UC08**.

### 3. Sincronização de Variações no `PUT /api/v1/produtos/:id` Preservando IDs
- **Decisão**: Quando o campo `variations` é enviado no `PUT /api/v1/produtos/:id`, a sincronização em transação (`sql.begin`) preserva os UUIDs existentes:
  1. Variações enviadas com `id` pertencente ao produto são atualizadas (`UPDATE product_variations`).
  2. Variações enviadas sem `id` são inseridas (`INSERT INTO product_variations`).
  3. Variações ativas do produto que foram omitidas do array enviado recebem soft delete (`UPDATE product_variations SET deleted_at = CURRENT_TIMESTAMP`).
  Se `variations` for `undefined` no `PUT`, as variações atuais permanecem inalteradas.
- **Alternativa Rejeitada**: Fazer soft delete em todas as variações e reinseri-las com novos UUIDs a cada edição quebraria as chaves estrangeiras `variation_id` das fotos (`product_images` na `US-BE-10`) e dos itens salvos em listas de clientes (`list_items` na `US-BE-13`).

### 4. Regras de Disponibilidade (`availabilityType`) e Prazo (`estimatedDays`)
- **Decisão**:
  - `availabilityType` aceita exclusivamente `'IN_STOCK'` ou `'ON_DEMAND'`.
  - Quando `'ON_DEMAND'`, `estimatedDays` é obrigatório e deve ser um inteiro `>= 1`.
  - Quando `'IN_STOCK'`, `estimatedDays` pode ser omitido ou `0`, sendo normalizado automaticamente para `0`.
- **Alternativa Rejeitada**: Permitir `ON_DEMAND` com `estimatedDays = 0` deixaria produtos sob encomenda sem prazo estimado no catálogo; exigir `estimatedDays` explícito em `IN_STOCK` adicionaria atrito desnecessário ao cliente da API.

### 5. Validação de Vínculos Cadastrais (`categoryId`, `subtypeId` opcional e `supplierId`)
- **Decisão**:
  - No `POST`, `categoryId` e `supplierId` são obrigatórios (`UUID` válidos e registros ativos com `deleted_at IS NULL`).
  - `subtypeId` é opcional (`string | null`). Quando informado, o backend valida se o subtipo existe (`deleted_at IS NULL`) e se seu `category_id` corresponde exatamente ao `categoryId` do produto (caso contrário, retorna `400 Bad Request`).
- **Alternativa Rejeitada**: Tornar `subtypeId` obrigatório impediria o cadastro de móveis em categorias que eventualmente não exijam subcategoria específica e entraria em conflito com `subtypeId: string | null` já definido em `ProductDto`.

### 6. Soft Delete em Cascata Lógica
- **Decisão**: `DELETE /api/v1/produtos/:id` executa uma transação SQL que preenche `deleted_at = CURRENT_TIMESTAMP` no registro de `products` e também nos registros ativos vinculados em `product_variations` e `product_images`.
- **Alternativa Rejeitada**: `ON DELETE CASCADE` físico é proibido pelo **RNF08**.

### 7. Imagens em Arquivo no Volume de Uploads, Caminho no Banco
- **Decisão**: Fotos e amostras de variação são arquivos no diretório `uploads/` do backend, que em produção é o volume nomeado `uploads_data` montado em `/app/uploads`. As colunas `thumbnail_path`, `full_image_path` e `sample_image_path` (`VARCHAR(255)`) guardam o caminho relativo a esse diretório; o limite de 255 caracteres impede, no próprio banco, que um conteúdo Base64 seja gravado ali. Os mapeadores do repositório convertem o caminho em URL com `toUploadUrl` (`/api/v1/uploads/<caminho>`, sob o mesmo proxy da API no Vite e no Nginx). O JSON de `POST`/`PUT` não carrega imagem, e a sincronização de variações não toca em `sample_image_path`, que só muda pelo upload da `US-BE-10`.
- **Alternativa Rejeitada**: Base64 em colunas `TEXT`, como na primeira versão desta change. A imagem cresce cerca de 33%, toda consulta, resposta JSON e backup que toca a linha carrega o binário, o navegador não consegue cachear cada foto, e o `GET /api/v1/produtos/:id` com um carrossel em alta resolução passaria de vários MB. `BYTEA` tem o mesmo peso no banco e no backup. Storage externo (S3 ou similar) é desnecessário para uma única VM e traria custo e dependência novos.

## Risks / Trade-offs

- **[Colisão de Slug em Concorrência]** → *Mitigação*: Além da checagem prévia no service (`existsProductSlugActive`), o banco possui o índice único parcial `idx_products_slug_active ON products (slug) WHERE deleted_at IS NULL` e o service converte violações `23505` (`isUniqueViolation`) em `409 Conflict`.
- **[Troca de `categoryId` no `PUT` deixando `subtypeId` órfão de outra categoria]** → *Mitigação*: No `PUT`, o service resolve o par final `(effectiveCategoryId, effectiveSubtypeId)` combinando o payload com o estado atual do produto e valida que `effectiveSubtypeId` pertence a `effectiveCategoryId`.
- **[Vendedor tentando transferir produto para fornecedor não vinculado no `PUT`]** → *Mitigação*: No `PUT`, o service valida a autorização do Vendedor tanto para o `existing.supplierId` (dono atual do produto) quanto para o `dto.supplierId` (novo fornecedor, se enviado).
- **[Banco local com a versão Base64 de `011`/`012` já aplicada]** → *Mitigação*: As migrações foram corrigidas no próprio arquivo porque nunca entraram na `main` nem rodaram na VM. O runner identifica migrações pelo nome do arquivo, então quem já as aplicou localmente precisa remover `product_images`, `product_variations` e `products` e apagar as linhas `010`–`012` de `_migrations` antes de rodar `bun run migrate` de novo.
- **[Perda das fotos ao recriar containers ou volumes]** → *Mitigação*: O volume nomeado `uploads_data` sobrevive ao `deploy.sh`; o `README.md` avisa que `down -v` apaga as fotos, e o backup do volume junto com o dump do banco entra na `US-BE-10`.
