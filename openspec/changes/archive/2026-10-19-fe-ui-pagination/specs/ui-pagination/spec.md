## ADDED Requirements

### Requirement: Tipo Genérico para o Envelope Paginado
O frontend SHALL declarar em `frontend/src/types/pagination.ts` os tipos `PaginationParams`, `PaginationMeta` e `Paginated<T>`, espelhando o envelope `{ data, pagination }` do RNF11, e SHALL usá-los como base dos tipos de resposta e de filtro de todas as listagens paginadas.

#### Scenario: Declarar tipo de resposta de uma nova listagem
- **WHEN** um desenvolvedor cria o tipo de resposta de uma listagem paginada
- **THEN** o tipo SHALL ser um alias de `Paginated<T>` e os parâmetros de filtro SHALL estender `PaginationParams`, sem repetir os campos `page`, `limit`, `total` e `totalPages`

### Requirement: Componente Global de Paginação
O frontend SHALL fornecer o componente `UiPagination` em `frontend/src/components/ui/UiPagination.vue`, recebendo `page`, `totalPages`, `total`, `itemLabel` e `disabled` e emitindo `update:page`, como único componente de paginação das listagens.

#### Scenario: Exibir resumo e números na listagem administrativa
- **WHEN** uma listagem informa `page`, `totalPages` e `total`
- **THEN** o componente SHALL exibir o resumo "Página X de Y (N itens)" usando `itemLabel` (padrão "registros"), os botões Anterior e Próxima e os números de página com reticências para janelas grandes

#### Scenario: Navegar para outra página
- **WHEN** o usuário aciona Anterior, Próxima ou um número de página válido e diferente da atual
- **THEN** o componente SHALL emitir `update:page` com o número da nova página e destacar a página atual com `aria-current="page"`

#### Scenario: Ignorar navegação inválida
- **WHEN** a navegação aponta para uma página fora do intervalo `1..totalPages` ou igual à atual
- **THEN** o componente SHALL não emitir `update:page` e SHALL manter o botão Anterior desabilitado na primeira página e o botão Próxima desabilitado na última

#### Scenario: Travar navegação durante o carregamento
- **WHEN** a prop `disabled` é verdadeira
- **THEN** o componente SHALL desabilitar todos os controles de navegação

### Requirement: Regras de Exibição da Paginação
O componente SHALL ocultar os controles quando não houver mais de uma página e SHALL exibir o resumo apenas quando `total` for informado.

#### Scenario: Página única com resumo
- **WHEN** `totalPages` é menor ou igual a 1 e `total` é informado
- **THEN** o componente SHALL exibir apenas o resumo e SHALL ocultar os botões de navegação

#### Scenario: Página única sem resumo
- **WHEN** `totalPages` é menor ou igual a 1 e `total` não é informado
- **THEN** o componente SHALL não renderizar nenhum elemento

### Requirement: Uso Obrigatório em Listagens Paginadas
Toda listagem paginada do frontend SHALL usar `UiPagination`, e SHALL NOT escrever controles de paginação inline nem criar outro componente de paginação.

#### Scenario: Paginação nas telas administrativas
- **WHEN** o administrador acessa `/admin/fornecedores`, `/admin/categorias` ou `/admin/usuarios`
- **THEN** cada tela SHALL renderizar `UiPagination` com resumo (`total`), desabilitado durante o carregamento, e SHALL reiniciar na página 1 ao aplicar busca ou filtro

#### Scenario: Paginação no catálogo público
- **WHEN** o visitante acessa `/catalogo` com mais de uma página de produtos
- **THEN** a tela SHALL renderizar `UiPagination` sem resumo, mantendo o parâmetro `?page=` da URL sincronizado, e o componente `CatalogPagination.vue` SHALL deixar de existir
