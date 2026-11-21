# Proposal: Exibição e Filtro de Fornecedor no Catálogo e na Tela de Produto

## Why

O catálogo público já persiste o vínculo `products.supplier_id` e aceita `supplierId` em `GET /api/v1/produtos`, mas os clientes ainda não conseguem visualizar o fabricante/marca na página do produto (`/catalogo/:slug`) nem filtrar móveis por fornecedor na tela de busca (`/catalogo`).

## What Changes

- **Backend (`[BE]`)**:
  - Incluir `supplierName` (`string | null`) em `ProductDto` e `ProductDetailDto` por meio de `LEFT JOIN suppliers` nas consultas de produtos.
  - Tornar `GET /api/v1/suppliers` pública (removendo `authMiddleware` e `requireRole`, usando `attachUserIfAuthenticated` no mesmo padrão de `GET /api/v1/categorias`): visitantes anônimos e Clientes recebem apenas fornecedores ativos com `contact: null` e busca restrita a `name`; Vendedores mantêm escopo `user_suppliers` (RF16); Administradores mantêm acesso completo com `contact` e filtro `active`.
  - Manter `GET /api/v1/suppliers/:id`, `POST`, `PUT` e `DELETE` protegidas pelo RBAC.
  - Atualizar a collection Bruno em `docs/backend/collections/bruno/`.
- **Frontend (`[FE]`)**:
  - Adicionar seção de filtro **Fornecedor** na barra lateral (`/catalogo`), consumindo `GET /api/v1/suppliers`, sincronizada com `?fornecedor=` na URL e traduzida para `supplierId` em `GET /api/v1/produtos`.
  - Exibir o fornecedor na página de detalhe do produto (`/catalogo/:slug`) próximo ao título (com atalho para `/catalogo?fornecedor=...`) e na tabela técnica zebrada.
  - Refatorar `CatalogoProdutoDetalheView.vue` extraindo `CatalogoProdutoInfo.vue` para manter ambos entre 150 e 500 linhas.

## Non-goals

- Nenhuma migração de banco de dados (`[DB]`) é necessária; as tabelas e índices atuais já atendem a mudança.
- Não criar uma nova rota de fornecedores; reutilizar `GET /api/v1/suppliers`.
- Não expor `suppliers.contact` para visitantes anônimos ou Clientes.
- Não alterar a matriz de permissões (`RBAC`) das rotas de detalhe e mutação de `/api/v1/suppliers` nem o isolamento de escrita de vendedores.
- Não adicionar filtro por material, cor/acabamento ou ordenação nesta entrega.
