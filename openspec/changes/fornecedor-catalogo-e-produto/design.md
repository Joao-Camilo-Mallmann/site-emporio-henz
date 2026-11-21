# Design: Fornecedor no Catálogo e na Tela de Produto

## Decisões Arquiteturais

1. **Sem migração de banco (`[DB]`)**: `suppliers` (`005_create_suppliers.sql`) e `products` (`010_create_products.sql`) já possuem `supplier_id`, FK `ON DELETE RESTRICT` e índices parciais `idx_suppliers_active` e `idx_products_supplier_active`.
2. **Listagem pública na rota existente `GET /api/v1/suppliers`**:
   - Reutiliza `GET /api/v1/suppliers` removendo `authMiddleware` e `requireRole(ROLES.SELLER, ROLES.ADMIN)` e adotando `attachUserIfAuthenticated` (mesmo padrão de `GET /api/v1/categorias`).
   - Visitantes anônimos e Clientes (`!actor || actor.role === ROLES.CUSTOMER`) recebem apenas fornecedores ativos (`active = true`, `deleted_at IS NULL`), com `contact: null` e busca textual (`search`) restrita a `name`.
   - Vendedores (`ROLES.SELLER`) continuam recebendo apenas fornecedores vinculados via `user_suppliers` com `contact` preservado (RF16); Administradores (`ROLES.ADMIN`) mantêm acesso completo com `contact` e filtro `active`.
   - As rotas `GET /:id`, `POST`, `PUT` e `DELETE` em `/api/v1/suppliers` mantêm o RBAC intacto.
3. **`supplierName` em `ProductDto` / `ProductDetailDto`**:
   - Obtido via `LEFT JOIN suppliers s ON s.id = p.supplier_id AND s.deleted_at IS NULL` em todas as leituras de produto (`listPaginated`, `selectProductRow`, `selectProductRowBySlug`, `findRecommendations`) e relido após `createProduct`.
4. **Catálogo público e URL (`/catalogo`)**:
   - Parâmetro legível `?fornecedor=<slug>` (aceitando também UUID como fallback), traduzido no cliente via lista carregada de `GET /api/v1/suppliers` (reutilizando `fornecedoresApi.listar`) para `supplierId` em `GET /api/v1/produtos`.
   - Filtro na barra lateral com chips `<UiButton>` no mesmo padrão visual de Categoria e Subcategoria.
   - Cache de fornecedores co-localizado em `useCatalogoProdutos.ts` para evitar arquivos abaixo do mínimo de 150 linhas.
5. **Tela do produto (`/catalogo/:slug`)**:
   - Exibe o fornecedor logo abaixo do título como `<UiButton variant="link" size="none">` apontando para `/catalogo?fornecedor=<slug>` e também na ficha técnica zebrada.
   - Extrai a coluna comercial direita de `CatalogoProdutoDetalheView.vue` para `CatalogoProdutoInfo.vue` (ambos entre 150 e 500 linhas).
6. **Vendedor logado no catálogo**:
   - Como `GET /api/v1/suppliers` já devolve apenas fornecedores vinculados ao vendedor, a barra lateral exibe somente opções válidas para ele; caso acesse manualmente uma URL com outro fornecedor e `GET /api/v1/produtos` responda `403`, o catálogo exibe mensagem amigável.
