## Why

O backend padronizou todas as rotas de listagem para seguirem o RNF11 (`backend/src/lib/pagination.ts`), retornando o envelope `{ data: T[], pagination: { page, limit, total, totalPages } }`, e as rotas já foram devidamente documentadas na collection Bruno. No entanto, a tela e o serviço de fornecedores no frontend (`frontend/src/views/admin/fornecedores/FornecedorListView.vue` e `frontend/src/api/fornecedores.ts`) continuavam esperando um array puro (`ISupplier[]`), o que causa quebra em tempo de execução (`suppliers.value.filter is not a function`) e impede o uso correto da paginação e busca no servidor.

## What Changes

- **Tipos de Fornecedor (`frontend/src/types/suppliers.ts`)**: Adicionar interfaces `SupplierFilterParams` (`page`, `limit`, `search`, `active`) e `PaginatedSuppliersResponse` (`data`, `pagination`).
- **Serviço de API (`frontend/src/api/fornecedores.ts`)**: Atualizar `listar(params?: SupplierFilterParams): Promise<PaginatedSuppliersResponse>` para enviar query parameters e tipar o envelope de resposta.
- **Visualização Administrativa (`frontend/src/views/admin/fornecedores/FornecedorListView.vue`)**:
  - Consumir o envelope `{ data, pagination }` da API.
  - Adicionar estados de controle de paginação: `currentPage`, `totalPages`, `totalSuppliers`, `pageSize`.
  - Integrar busca textual (`searchTerm`) enviada ao servidor.
  - Adicionar controles visuais de paginação consistentes com o padrão de `UsuarioListView.vue` (botões Anterior/Próxima e contador de página/registros).

## Capabilities

### New Capabilities

*(Nenhuma nova capacidade criada)*

### Modified Capabilities

- `admin-gestao-fornecedores`: Atualizar o requisito de listagem e busca para consumir a API paginada no servidor (`page`, `limit`, `search`), exibindo controles de navegação entre páginas e sincronizando os totais retornados pelo backend.

## Impact

- Afeta `frontend/src/types/suppliers.ts`, `frontend/src/api/fornecedores.ts` e `frontend/src/views/admin/fornecedores/FornecedorListView.vue`.
- Não quebra APIs existentes nem requer alterações no banco de dados ou no backend (que já possuem a implementação de paginação validada).
