## ADDED Requirements

### Requirement: Listagem de Fornecedores Vinculados ao Vendedor
O sistema SHALL permitir que o Administrador consulte as empresas e marcas parceiras vinculadas a qualquer vendedor cadastrado.

#### Scenario: Consulta de fornecedores do vendedor
- **WHEN** o Administrador aciona a gestão de fornecedores de um vendedor
- **THEN** o sistema carrega os fornecedores ativos do catálogo e destaca quais estão vinculados ativamente ao vendedor (`user_suppliers`)

### Requirement: Atribuição e Revogação de Vínculos de Fornecedores
O sistema SHALL permitir que o Administrador altere a seleção de fornecedores de um vendedor, disparando as operações de vínculo e desvinculação na API com feedback reativo imediato sem recarregar a página.

#### Scenario: Atribuição de novos fornecedores
- **WHEN** o Administrador seleciona um ou mais fornecedores não vinculados e confirma a gravação
- **THEN** o sistema dispara requisições `POST /api/v1/users/:userId/suppliers` para cada novo fornecedor, exibe notificação de sucesso e atualiza a listagem local

#### Scenario: Revogação de fornecedor existente
- **WHEN** o Administrador desmarca um fornecedor previamente vinculado e confirma a gravação
- **THEN** o sistema dispara requisição `DELETE /api/v1/users/:userId/suppliers/:supplierId`, exibe notificação de sucesso e reflete a remoção imediatamente

#### Scenario: Tratamento de falhas na sincronização
- **WHEN** ocorre erro em alguma das operações de vínculo ou desvinculação
- **THEN** o sistema mantém os dados na tela, exibe notificação de erro com a mensagem retornada pela API e não fecha o modal

### Requirement: Acesso na Tabela de Usuários
O sistema SHALL disponibilizar botão de ação rápida para gestão de vínculos diretamente na listagem de usuários do painel administrativo, restrito a contas com perfil Vendedor.

#### Scenario: Ação visível exclusivamente para perfil Vendedor
- **WHEN** o Administrador acessa `/admin/usuarios`
- **THEN** as linhas de usuários com `role = 2` (Vendedor) exibem o botão "Fornecedores Autorizados", enquanto usuários com outros perfis (Cliente ou Administrador) não exibem esse botão

### Requirement: Gestão de Vínculos na Edição de Usuário
O sistema SHALL exibir seção informativa de marcas autorizadas na tela de edição de usuários quando o registro for do tipo Vendedor.

#### Scenario: Visualização e acionamento de vínculos na edição
- **WHEN** o Administrador edita um usuário com papel Vendedor em `/admin/usuarios/:id/editar`
- **THEN** o formulário exibe uma seção dedicada com chips informativos dos fornecedores já vinculados e botão para abrir o modal de gestão de vínculos
