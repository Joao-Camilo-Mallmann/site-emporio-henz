## ADDED Requirements

### Requirement: Listagem Paginada e Filtros de Usuários no Painel Administrativo
O painel administrativo SHALL fornecer uma interface em `/admin/usuarios` para listar, buscar e filtrar todos os usuários e clientes cadastrados.

#### Scenario: Visualizar listagem de usuários com paginação
- **WHEN** um usuário autenticado com perfil Administrador acessa `/admin/usuarios`
- **THEN** a aplicação SHALL carregar os usuários da página atual via `GET /api/v1/users`, exibindo nome, e-mail, telefone, cidade, papel e controles de paginação, com ações para novo cadastro e edição

#### Scenario: Filtrar por papel (Cliente, Vendedor, Administrador)
- **WHEN** o administrador seleciona um papel no seletor de filtros
- **THEN** a listagem SHALL consultar a API com o parâmetro `role` e exibir apenas usuários do perfil selecionado

#### Scenario: Buscar por nome ou e-mail
- **WHEN** o administrador digita no campo de busca e aciona a pesquisa
- **THEN** a aplicação SHALL consultar a API com o parâmetro `search` e exibir os resultados correspondentes

### Requirement: Cadastro de Usuário em Tela Dedicada
A aplicação SHALL permitir ao Administrador cadastrar novos usuários e definir seus respectivos papéis através de uma tela de formulário dedicada em `/admin/usuarios/novo`.

#### Scenario: Navegar para cadastro de novo usuário
- **WHEN** o administrador clica no botão "Novo Usuário" na listagem
- **THEN** o roteador SHALL redirecionar para a página `/admin/usuarios/novo` apresentando o formulário limpo

#### Scenario: Cadastro com sucesso
- **WHEN** o administrador preenche nome completo, e-mail válido, senha inicial (mínimo 6 caracteres), perfil e telefone/cidade opcionais
- **THEN** o sistema SHALL enviar requisição para `POST /api/v1/users`, redirecionar para `/admin/usuarios` e exibir mensagem de confirmação

### Requirement: Edição de Usuário Existente em Tela Dedicada
A aplicação SHALL permitir ao Administrador atualizar os dados de um usuário existente em tela de formulário dedicada `/admin/usuarios/:id/editar`.

#### Scenario: Carregar dados para edição
- **WHEN** o administrador acessa `/admin/usuarios/:id/editar`
- **THEN** a aplicação SHALL carregar os dados do usuário via `GET /api/v1/users/:id` e preencher os campos do formulário (com e-mail bloqueado para edição)

#### Scenario: Atualização com sucesso
- **WHEN** o administrador edita os dados de um usuário e submete o formulário
- **THEN** o sistema SHALL enviar requisição para `PUT /api/v1/users/:id`, redirecionar para `/admin/usuarios` e exibir mensagem de sucesso

### Requirement: Desativação Lógica de Usuário (Soft Delete)
A aplicação SHALL permitir ao Administrador desativar a conta de um usuário através de confirmação explícita em diálogo de confirmação.

#### Scenario: Desativação confirmada
- **WHEN** o administrador confirma a exclusão lógica de um usuário no diálogo de confirmação
- **THEN** o sistema SHALL enviar requisição para `DELETE /api/v1/users/:id` e remover o usuário da listagem ativa
