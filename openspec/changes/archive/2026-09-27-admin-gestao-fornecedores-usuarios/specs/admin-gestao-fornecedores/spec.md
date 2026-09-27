## ADDED Requirements

### Requirement: Listagem e Busca de Fornecedores no Painel Administrativo
O painel administrativo SHALL fornecer uma interface dedicada em `/admin/fornecedores` para listar e pesquisar marcas e fábricas parceiras cadastradas.

#### Scenario: Visualizar listagem de fornecedores
- **WHEN** um usuário autenticado com perfil Administrador acessa `/admin/fornecedores`
- **THEN** a aplicação SHALL carregar e exibir a lista de fornecedores ativos com nome, contato, status e data de criação, além de botões para novo cadastro e edição

#### Scenario: Filtrar fornecedores por nome ou contato
- **WHEN** o administrador digita um termo de busca no campo de pesquisa
- **THEN** a tabela SHALL filtrar em tempo real os fornecedores cujo nome ou informação de contato contenha o termo digitado

### Requirement: Cadastro de Novo Fornecedor em Tela Dedicada
A aplicação SHALL permitir ao Administrador cadastrar novas marcas e fornecedores parceiros através de uma tela dedicada de formulário em `/admin/fornecedores/novo`.

#### Scenario: Navegar para cadastro de novo fornecedor
- **WHEN** o administrador clica no botão "Novo Fornecedor" na listagem
- **THEN** o roteador SHALL redirecionar para a página `/admin/fornecedores/novo` apresentando o formulário limpo

#### Scenario: Cadastro com sucesso
- **WHEN** o administrador preenche o nome da empresa (mínimo 2 caracteres), dados de contato e confirma o formulário
- **THEN** o sistema SHALL enviar requisição para `POST /api/v1/suppliers`, redirecionar para `/admin/fornecedores` e exibir notificação de sucesso

#### Scenario: Validação de campos obrigatórios
- **WHEN** o administrador tenta salvar um fornecedor com nome vazio ou com menos de 2 caracteres
- **THEN** o formulário SHALL bloquear o envio e exibir mensagem de validação no campo

### Requirement: Edição de Fornecedor Existente em Tela Dedicada
A aplicação SHALL permitir ao Administrador atualizar o nome, contato e status ativo/inativo de um fornecedor existente em tela dedicada `/admin/fornecedores/:id/editar`.

#### Scenario: Carregar dados para edição
- **WHEN** o administrador acessa `/admin/fornecedores/:id/editar`
- **THEN** a aplicação SHALL carregar os dados atuais do fornecedor via `GET /api/v1/suppliers/:id` e preencher os campos do formulário

#### Scenario: Atualização com sucesso
- **WHEN** o administrador altera os dados do fornecedor e confirma
- **THEN** o sistema SHALL enviar requisição para `PUT /api/v1/suppliers/:id`, redirecionar para `/admin/fornecedores` e notificar sucesso

### Requirement: Desativação Lógica de Fornecedor (Soft Delete)
A aplicação SHALL permitir ao Administrador inativar logicamente um fornecedor após confirmação explícita em diálogo de confirmação.

#### Scenario: Desativação confirmada
- **WHEN** o administrador clica no botão de desativar na tabela e confirma no diálogo de confirmação
- **THEN** o sistema SHALL enviar requisição para `DELETE /api/v1/suppliers/:id`, atualizar o status do item sem remover o histórico e exibir feedback visual
