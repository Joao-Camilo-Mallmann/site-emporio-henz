## Why

Atende à história de usuário [US-FE-06] do backlog mestre e aos requisitos RF15, RF16 e RF17 do PRD. A API e a tabela associativa `user_suppliers` já estão 100% implementadas no backend (`[US-BE-07]`), mas o Administrador ainda não possui recursos na interface web para consultar, atribuir ou revogar as empresas parceiras que cada vendedor tem autorização para gerenciar. Esta mudança entrega a governança multi-empresa visual e reativa no painel administrativo.

## What Changes

- **Integração de API no Frontend**: Adição dos métodos `listarFornecedores`, `vincularFornecedor` e `desvincularFornecedor` em `frontend/src/api/usuarios.ts` consumindo `/api/v1/users/:userId/suppliers`.
- **Tipagem Contratual**: Adição das interfaces de fornecedores vinculados (`IAssignedSupplier`, `UserSupplierLinkDto` e paginação correspondente) em `frontend/src/types/`.
- **Componente Modal Reutilizável**: Criação de `VendedorFornecedoresModal.vue` exibindo lista de fornecedores ativos cadastrados, busca rápida, checkboxes de seleção e sincronização atômica de vínculos com feedback por toast.
- **Ação Rápida na Listagem de Usuários**: Inclusão de botão de ação "Fornecedores Autorizados" em `UsuarioListView.vue` exclusivo para registros com papel Vendedor (`role = 2`).
- **Seção Integrada na Edição de Usuário**: Exibição de bloco informativo com chips das marcas autorizadas e botão para gerenciar vínculos diretamente em `UsuarioEditView.vue` quando o usuário editado for Vendedor.
- **Rastreabilidade no Backlog**: Atualização dos critérios de aceitação de [US-FE-06] em `docs/planning/user-stories-backlog.md`.

## Capabilities

### New Capabilities
- `admin-user-suppliers-ui`: Interface administrativa e serviços do frontend para gestão de vínculos multi-empresa entre vendedores e fornecedores parceiros, permitindo atribuir e revogar marcas autorizadas sem recarregar a página.

### Modified Capabilities
<!-- Nenhuma alteração em especificações de requisitos existentes -->

## Impact

- **Código Frontend**: `frontend/src/api/usuarios.ts`, `frontend/src/types/`, `frontend/src/views/admin/usuarios/UsuarioListView.vue`, `frontend/src/views/admin/usuarios/UsuarioEditView.vue`, e novo componente `frontend/src/views/admin/usuarios/VendedorFornecedoresModal.vue`.
- **Contratos de API**: Nenhum endpoint de backend é criado ou alterado; consome os contratos existentes em `backend/src/modules/user-suppliers/`.
- **Dependências**: Nenhuma dependência externa nova adicionada ao frontend.
