## ADDED Requirements

### Requirement: Listagem Paginada de Categorias no Painel Administrativo
O painel administrativo SHALL fornecer uma interface dedicada em `/admin/categorias` para listar e pesquisar categorias cadastradas, com paginação via backend.

#### Scenario: Visualizar listagem de categorias
- **WHEN** um usuário autenticado com perfil Administrador acessa `/admin/categorias`
- **THEN** a aplicação SHALL carregar e exibir a lista paginada de categorias via `GET /api/v1/categorias`, apresentando nome, slug, status ativo/inativo, quantidade de subtipos e data de cadastro

#### Scenario: Filtrar categorias por busca textual
- **WHEN** o administrador digita um termo de busca no campo de pesquisa e aciona a busca
- **THEN** a aplicação SHALL solicitar as categorias filtradas ao servidor via parâmetro `search` e reiniciar na página 1

### Requirement: Criação e Edição de Categorias
A aplicação SHALL permitir ao Administrador cadastrar novas categorias e editar categorias existentes.

#### Scenario: Cadastrar nova categoria com sucesso
- **WHEN** o administrador preenche o nome da categoria e confirma o formulário
- **THEN** o sistema SHALL enviar requisição para `POST /api/v1/categorias`, atualizar a lista e exibir notificação toast de sucesso

#### Scenario: Editar categoria existente
- **WHEN** o administrador altera o nome ou slug de uma categoria e confirma
- **THEN** o sistema SHALL enviar requisição para `PUT /api/v1/categorias/:id`, atualizar a tabela e notificar sucesso

### Requirement: Gestão de Subtipos por Categoria
A aplicação SHALL permitir ao Administrador visualizar, criar, editar e desativar subtipos associados a uma categoria.

#### Scenario: Visualizar subtipos vinculados
- **WHEN** o administrador visualiza os detalhes ou modal de uma categoria
- **THEN** a interface SHALL listar os subtipos associados àquela categoria

#### Scenario: Criar novo subtipo vinculado
- **WHEN** o administrador preenche o nome de um novo subtipo para a categoria selecionada e confirma
- **THEN** a aplicação SHALL enviar requisição para `POST /api/v1/subtipos` com o `categoryId` correspondente e atualizar a visualização

### Requirement: Desativação Lógica de Categoria e Subtipo (Soft Delete)
A aplicação SHALL permitir ao Administrador inativar logicamente uma categoria ou subtipo mediante confirmação explícita.

#### Scenario: Confirmar desativação de categoria
- **WHEN** o administrador aciona a desativação de uma categoria e confirma no modal
- **THEN** o sistema SHALL enviar requisição para `DELETE /api/v1/categorias/:id`, mantendo os dados no histórico e atualizando o status visual
