# fe-modais-listas Specification

## Purpose
TBD - created by archiving change fe-listas-modais-salvar. Update Purpose after archive.
## Requirements
### Requirement: Inicialização e Gestão Reativa de Listas na Store Pinia
The system MUST initialize the client lists in a reactive Pinia store (`useListasStore`) containing the 3 mandatory system lists (**Favoritos**, **Lista de Desejos**, **Lista de Presentes**) with `isSystem = true` and unique `shareSlug` UUID, and MUST persist mutations in `localStorage`.

#### Scenario: Primeiro acesso do usuário inicializa as 3 listas padrão
- **WHEN** o usuário abre a aplicação pela primeira vez sem dados salvos no `localStorage`
- **THEN** a store inicializa automaticamente as listas "Favoritos", "Lista de Desejos" e "Lista de Presentes", todas com contadores zerados, `isSystem: true` e `shareSlug` UUID gerado.

#### Scenario: Criação de nova pasta personalizada
- **WHEN** o usuário cria uma pasta com o nome "Apartamento 302"
- **THEN** a pasta é inserida na store com `isSystem: false`, um `shareSlug` exclusivo e persistida no `localStorage`.

#### Scenario: Bloqueio de exclusão e renomeação de listas padrão
- **WHEN** uma tentativa de exclusão ou renomeação é disparada contra "Favoritos", "Lista de Desejos" ou "Lista de Presentes"
- **THEN** a store e a interface rejeitam a mutação, mantendo as 3 listas padrão inalteradas e permanentes.

---

### Requirement: Modal de Salvamento de Produto em Lista (`SalvarEmListaModal.vue`)
The system MUST provide a reusable modal `SalvarEmListaModal.vue` triggered when clicking the save button on any product card or product detail page, allowing the user to pick an existing folder, create a new one inline, and assign the product with its selected finish.

#### Scenario: Abertura do modal com dados do produto e seleção de pasta
- **WHEN** o usuário clica no botão "Salvar" de um produto
- **THEN** o modal abre exibindo foto, nome, valor e acabamento do produto, acompanhado da lista de pastas disponíveis com suas respectivas quantidades de itens.

#### Scenario: Identificação de produto já salvo na pasta
- **WHEN** o produto já estiver presente em uma das pastas listadas
- **THEN** a interface sinaliza visualmente a pasta como já contendo aquele item, permitindo adicionar a outras pastas simultaneamente ou remover.

#### Scenario: Criação rápida de pasta no próprio modal
- **WHEN** o usuário digita o nome de uma nova pasta no campo inline e confirma
- **THEN** a nova pasta é criada imediatamente na store e já aparece selecionada para salvar o produto atual.

#### Scenario: Confirmação e atalho para abrir a pasta
- **WHEN** o usuário confirma o salvamento do produto
- **THEN** o modal fecha, emite toast de sucesso e disponibiliza atalho para abrir o modal de gerenciamento diretamente na pasta selecionada.

---

### Requirement: Modal Central de Gerenciamento ("Minhas Listas") com Navegação em Dois Níveis
The system MUST provide a central modal `MinhasListasModal.vue` with two-level master-detail navigation: Level 1 displaying a clean list of all folders, and Level 2 displaying the items inside the selected folder.

#### Scenario: Visualização Nível 1 com listagem limpa de pastas
- **WHEN** o usuário abre o modal de Minhas Listas a partir da navbar
- **THEN** o modal exibe o Nível 1 com a lista de todas as pastas, contadores de itens, badges indicando se é padrão ou personalizada, e botões de ação para abrir cada pasta.

#### Scenario: Navegação para o Nível 2 (detalhe da pasta)
- **WHEN** o usuário clica em "Abrir Pasta" em uma das pastas listadas
- **THEN** o modal transiciona para o Nível 2, exibindo o botão "Voltar para Minhas Pastas", o título da pasta, o grid de móveis salvos e o total estimado.

#### Scenario: Remoção de móvel da pasta
- **WHEN** o usuário clica no botão "Remover" em um dos móveis salvos no Nível 2
- **THEN** o item é removido da lista reativamente, recalculando a contagem de itens e o valor total da pasta.

#### Scenario: Renomeação e exclusão de pasta personalizada no Nível 2
- **WHEN** o usuário clica em "Renomear" ou "Excluir" em uma pasta com `isSystem: false`
- **THEN** a ação é permitida e executada após confirmação, retornando ao Nível 1 caso a pasta seja removida.

---

### Requirement: Compartilhamento Público e Solicitação de Orçamento via WhatsApp
The system MUST provide in Level 2 of `MinhasListasModal.vue` actions to copy the public shareable link and to generate a pre-filled WhatsApp quote inquiry containing the list details.

#### Scenario: Cópia do link público da lista
- **WHEN** o usuário clica no botão "Copiar Link Público"
- **THEN** a URL contendo o `shareSlug` é copiada para a área de transferência e uma mensagem de feedback "Link copiado para a área de transferência!" é exibida.

#### Scenario: Solicitação de orçamento via WhatsApp
- **WHEN** o usuário clica em "Solicitar Orçamento no WhatsApp"
- **THEN** o sistema gera uma URL `https://wa.me/...` contendo o nome da lista, quantidade de móveis, relação de itens com preços e o link público compartilhado, abrindo o WhatsApp em nova aba.

---

### Requirement: Integração dos Disparadores Globais na Interface
The global interface MUST connect the save buttons in `CatalogoProdutoCard.vue`, `HomeView.vue`, `ProdutoDetalheView.vue`, and the "Salvos" links in `AppNavbar.vue` to the respective modal states.

#### Scenario: Clique no botão Salvos na Navbar
- **WHEN** o usuário clica em "Salvos" na navbar desktop, drawer mobile ou menu de usuário
- **THEN** o sistema abre o `MinhasListasModal.vue` no Nível 1.

#### Scenario: Clique no coração do card no catálogo
- **WHEN** o usuário clica no botão flutuante de coração em um card de produto no catálogo
- **THEN** o sistema abre o `SalvarEmListaModal.vue` preenchido com o produto clicado, sem navegar para a página de detalhes.

