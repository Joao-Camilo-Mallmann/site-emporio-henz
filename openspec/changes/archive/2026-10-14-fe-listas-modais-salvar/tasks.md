## 1. Tipagem e Modelagem de Dados

- [x] 1.1 Criar interfaces e tipos em `frontend/src/types/listas.ts` (`SavedItem`, `UserList`, `SaveProductPayload`, `CreateListPayload`)
- [x] 1.2 Exportar os novos tipos no barrel `frontend/src/types/index.ts`

## 2. Store Pinia e Persistência Local

- [x] 2.1 Criar a store `frontend/src/stores/listas.ts` inicializada com as 3 listas padrão (**Favoritos**, **Lista de Desejos**, **Lista de Presentes**), identificador `shareSlug` (UUID) e persistência reativa em `localStorage`
- [x] 2.2 Implementar ações na store: `addItemToList`, `removeItemFromList`, `createCustomList`, `renameCustomList` e `deleteCustomList` com trava estrita contra exclusão/renomeação das listas do sistema

## 3. Modal de Salvamento de Produto (`SalvarEmListaModal.vue`)

- [x] 3.1 Construir o componente `frontend/src/components/listas/SalvarEmListaModal.vue` utilizando `<UiModal>`, exibindo foto, nome, valor e acabamento do móvel selecionado
- [x] 3.2 Implementar listagem de pastas de destino com contadores, indicação visual caso o produto já esteja salvo e campo inline para criar nova pasta
- [x] 3.3 Adicionar lógica de submissão com toast de sucesso e atalho de ação para abrir o modal de gerenciamento diretamente na pasta selecionada

## 4. Modal Central de Gerenciamento ("Minhas Listas") (`MinhasListasModal.vue`)

- [x] 4.1 Construir a visualização do Nível 1 em `frontend/src/components/listas/MinhasListasModal.vue` com listagem limpa e compacta de pastas, badges (sistema vs customizada), contadores e botão de criar nova pasta
- [x] 4.2 Construir a visualização do Nível 2 com navegação de retorno ("← Voltar para Minhas Pastas"), grid de móveis com fotos, acabamentos, valores, botão de remoção e totalizador financeiro da pasta
- [x] 4.3 Adicionar ações de renomeação e exclusão para pastas personalizadas no Nível 2 com confirmação visual
- [x] 4.4 Implementar funcionalidade do botão "Copiar Link Público" copiando a URL compartilhável com `shareSlug` e exibindo toast de sucesso
- [x] 4.5 Implementar disparador do WhatsApp formatando a mensagem pré-preenchida com o nome da lista, itens e link público

## 5. Integração Global nos Disparadores da Interface

- [x] 5.1 Atualizar `frontend/src/components/layout/AppNavbar.vue` conectando os 3 disparadores de "Salvos" (Desktop, Mobile Drawer e Menu do Usuário) para acionar a abertura do `MinhasListasModal`
- [x] 5.2 Adicionar botão flutuante de salvar/coração no `frontend/src/components/catalogo/CatalogProductCard.vue` para abrir o `SalvarEmListaModal`
- [x] 5.3 Integrar o botão de salvar da página de detalhes `frontend/src/views/ProdutoDetalheView.vue` e os cards de móveis da `frontend/src/views/HomeView.vue` ao `SalvarEmListaModal`
- [x] 5.4 Registrar e disponibilizar os modais globais no `frontend/src/App.vue`

## 6. Validação, Tipagem e Build

- [x] 6.1 Executar checagem de tipos `bun run check-types` no frontend
- [x] 6.2 Executar linter `bun run lint` e build de produção `bun run build` para garantir conformidade
