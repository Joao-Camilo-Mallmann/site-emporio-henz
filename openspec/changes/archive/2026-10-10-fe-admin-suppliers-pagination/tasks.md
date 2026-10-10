## 1. Tipos e Contratos no Frontend

- [x] 1.1 `[FE]` Adicionar `SupplierFilterParams` e `PaginatedSuppliersResponse` em `frontend/src/types/suppliers.ts` e exportar em `frontend/src/types/index.ts`
- [x] 1.2 `[FE]` Atualizar `fornecedoresApi.listar` em `frontend/src/api/fornecedores.ts` para aceitar `params?: SupplierFilterParams` e retornar `Promise<PaginatedSuppliersResponse>`

## 2. Interface da Listagem de Fornecedores

- [x] 2.1 `[FE]` Refatorar o estado de listagem em `frontend/src/views/admin/fornecedores/FornecedorListView.vue` para consumir o envelope `{ data, pagination }` da API
- [x] 2.2 `[FE]` Adicionar controles e estados de paginação (página atual, total de páginas, total de registros, botões Anterior e Próxima) em `FornecedorListView.vue`
- [x] 2.3 `[FE]` Integrar busca textual no servidor com `handleSearch` resetando para a página 1 e vinculando ao input

## 3. Verificação e Testes

- [x] 3.1 `[FE]` Executar verificação de tipos com `vue-tsc` no diretório frontend
- [x] 3.2 `[FE]` Executar build de produção com `bun run build` no frontend
