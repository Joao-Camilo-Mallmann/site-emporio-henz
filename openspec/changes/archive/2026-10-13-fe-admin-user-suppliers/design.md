## Context

No backend, as rotas `/api/v1/users/:userId/suppliers` (`GET`, `POST`, `DELETE`) e a persistência em `user_suppliers` com soft delete já estão entregues e testadas (`[US-BE-07]`). No frontend, o painel administrativo (`AdminDashboardView.vue`) possui o card *"Vínculos de Vendedores"* apontando para `/admin/usuarios`, mas a interface de usuários ainda não oferece visualização nem interação com essas rotas.

Esta mudança entrega a camada de interface e integração do cliente HTTP para cumprir a história `[US-FE-06]`.

## Goals / Non-Goals

**Goals:**
- Prover um modal reutilizável (`VendedorFornecedoresModal.vue`) acionável a partir da listagem de usuários (`UsuarioListView.vue`) e da tela de edição de usuário (`UsuarioEditView.vue`).
- Permitir consulta clara dos fornecedores parceiros atualmente associados ao vendedor.
- Permitir vincular e desvincular empresas com cálculo de diff e sincronização em lote (`Promise.allSettled`).
- Atualizar a interface reativamente sem necessidade de recarregamento da página (F5).
- Restringir as ações na interface exclusivamente ao perfil Administrador.

**Non-Goals:**
- Nenhuma alteração no backend ou migração de banco de dados (infraestrutura de dados 100% pronta).
- Gestão de vínculos para perfis Cliente (`role = 1`) ou Administrador (`role = 3`), pois apenas Vendedores (`role = 2`) operam produtos sob escopo multi-empresa.
- Criação de rota de tela cheia separada para vínculos, mantendo a experiência fluida no fluxo existente de usuários.

## Decisions

### 1. Componente Modal Reutilizável (`VendedorFornecedoresModal.vue`)
- **Decisão**: Encapsular a lógica de carregamento, checklist e sincronização de marcas em um componente que utiliza `UiModal`.
- **Racional**: Permite que o administrador acione o vínculo diretamente na tabela de `/admin/usuarios` (ação rápida com 1 clique) ou enquanto edita os dados cadastrais do vendedor em `/admin/usuarios/:id/editar`, sem duplicar código.
- **Alternativas descartadas**:
  - *Criar uma rota/tela dedicada `/admin/vendedores/vinculos`*: Descartada por adicionar navegação desnecessária e afastar a governança da tela central de usuários.

### 2. Sincronização por Diff ao Confirmar
- **Decisão**: O modal mantém o estado inicial (`initialIds: Set<string>`) e o estado modificado pelo usuário (`selectedIds: Set<string>`). Ao clicar em "Salvar Alterações":
  - Identifica adições: `selectedIds \ initialIds` -> executa `POST /users/:userId/suppliers`
  - Identifica remoções: `initialIds \ selectedIds` -> executa `DELETE /users/:userId/suppliers/:supplierId`
  - Executa as mutações em lote com `Promise.allSettled`, reportando falhas parciais e recarregando o estado real. Carrega todas as páginas de fornecedores ativos e de vínculos, e mantém visíveis vínculos com fornecedores inativos para que possam ser removidos.
- **Racional**: Dá controle total ao usuário antes de efetivar mutações no banco e evita disparos prematuros de rede a cada checkbox clicado.
- **Alternativas descartadas**:
  - *Toggle imediato a cada checkbox*: Descartada por gerar requisições fragmentadas e não permitir cancelar alterações não intencionais.

### 3. Métodos na API Client em `usuariosApi` (`frontend/src/api/usuarios.ts`)
- **Decisão**: Registrar `listarFornecedores`, `vincularFornecedor` e `desvincularFornecedor` diretamente em `usuariosApi`.
- **Racional**: No backend, as rotas são prefixadas por `/api/v1/users/:userId/suppliers`, mantendo a coerência contratual entre o backend e o frontend.

## Risks / Trade-offs

- **[Falha parcial na sincronização de múltiplos vínculos]** → Mitigação: O modal captura erros de requisição, apresenta notificação clara via toast e recarrega os vínculos reais da API para manter a interface consistente com o estado do banco.
- **[Vendedor sem nenhuma marca vinculada]** → Mitigação: O modal exibe um aviso visual sutil informando que o vendedor sem empresas não poderá cadastrar produtos no catálogo (conforme regra de negócio RF15).
