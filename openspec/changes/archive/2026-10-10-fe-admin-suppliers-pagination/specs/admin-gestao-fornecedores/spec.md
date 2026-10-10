## MODIFIED Requirements

### Requirement: Listagem e Busca de Fornecedores no Painel Administrativo
O painel administrativo SHALL fornecer uma interface dedicada em `/admin/fornecedores` para listar e pesquisar marcas e fábricas parceiras cadastradas com paginação e busca no servidor.

#### Scenario: Visualizar listagem paginada de fornecedores
- **WHEN** um usuário autenticado com perfil Administrador acessa `/admin/fornecedores`
- **THEN** a aplicação SHALL carregar e exibir a página inicial de fornecedores via requisição paginada (`GET /api/v1/suppliers?page=1&limit=...`), exibindo nome, contato, status, data de criação e controles de paginação (página atual, total de registros, botões anterior e próxima)

#### Scenario: Filtrar fornecedores por nome ou contato no servidor
- **WHEN** o administrador digita um termo de busca no campo de pesquisa e confirma a busca
- **THEN** a aplicação SHALL solicitar os dados filtrados ao servidor com parâmetro `search` resetando para a página 1 e renderizando os registros retornados pelo backend

#### Scenario: Navegar entre páginas da listagem
- **WHEN** o administrador clica nos botões de navegação "Próxima" ou "Anterior"
- **THEN** a aplicação SHALL requisitar a página correspondente e atualizar a tabela com os novos registros e o indicador de página atual
