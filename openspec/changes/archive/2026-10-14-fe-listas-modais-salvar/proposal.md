## Why

Atualmente, o cliente e os profissionais (arquitetos/designers) não têm como salvar móveis em listas ou pastas de ambientes a partir do catálogo e da página de produto, nem gerenciar essas seleções. Os botões "Salvos" na navbar apontam para a raiz (`/`) e os botões de favoritar na Home e na página de produto contêm apenas ações simuladas em memória local com toasts. 

Esta mudança implementa no frontend um sistema fluido centrado em duas modais complementares: um modal para salvar/adicionar produtos em listas (com acabamentos e criação de pastas) e um modal central de gerenciamento em dois níveis (Nível 1: lista de pastas limpa com contadores; Nível 2: visualização dos itens da pasta selecionada, com remoção, cópia de link público e solicitação de orçamento via WhatsApp). O foco desta entrega é 100% frontend, reativo e desacoplado, com persistência via Pinia e `localStorage`.

## What Changes

- **Nova Store Pinia (`useListasStore`)**:
  - Inicialização automática com as 3 listas padrão obrigatórias do sistema: *Favoritos*, *Lista de Desejos* e *Lista de Presentes* (`isSystem: true`).
  - Suporte completo a operações reativas: adicionar produto (com variação opcional), remover item, criar pasta personalizada, renomear pasta personalizada e excluir pasta personalizada.
  - Bloqueio estrito de renomeação ou exclusão para as 3 listas padrão do sistema.
  - Persistência reativa no `localStorage` para manter o estado entre navegações e recarregamentos da página.
  - Geração de identificadores únicos (UUID) `shareSlug` para cada pasta, permitindo compartilhamento seguro.

- **Modal 1 (`SalvarEmListaModal.vue`)**:
  - Modal reutilizável disparado a partir de qualquer botão de salvar (card na Home, card no Catálogo ou botão na página de produto).
  - Exibe cabeçalho com miniatura, título e valor do produto, seletor de acabamento/variação ativo.
  - Lista de seleção das pastas existentes (com badges e contadores), com feedback visual caso o produto já esteja salvo naquela pasta.
  - Criação rápida de nova pasta personalizada inline (`+ Criar nova pasta`).
  - Ação pós-salvamento com feedback visual e atalho para abrir diretamente a pasta no modal de gerenciamento.

- **Modal 2 (`MinhasListasModal.vue`)**:
  - Modal central de gerenciamento com navegação Master-Detail em dois níveis:
    - **Nível 1 (Pastas)**: Visão limpa e compacta de todas as listas com nome, quantidade de itens salvos, status (padrão vs personalizada) e botão de ação para abrir a pasta. Ação de criar nova pasta.
    - **Nível 2 (Móveis da Pasta)**: Ao entrar na pasta, exibe navegação de retorno ("← Voltar para Minhas Pastas"), ações de renomear e excluir (somente para pastas customizadas), botão "Copiar Link Público" (com toast de feedback) e botão "Solicitar Orçamento no WhatsApp" formatado.
    - Grid de móveis salvos na pasta com foto, acabamento, valor formatado e botão de remoção rápida.
    - Totalizador financeiro estimado da pasta.

- **Integração na Interface Global**:
  - Atualização dos 3 pontos de "Salvos" no `AppNavbar.vue` (Desktop, Mobile Drawer e Menu do Usuário) para disparar a abertura do `MinhasListasModal`.
  - Inclusão do botão flutuante de salvar/coração no `CatalogProductCard.vue` (atendendo ao RF09).
  - Substituição dos mocks estáticos em `HomeView.vue` e `ProdutoDetalheView.vue` pela integração com o `SalvarEmListaModal`.

## Capabilities

### New Capabilities
- `fe-modais-listas`: Gerenciamento e salvamento de produtos em listas/pastas do cliente e de arquitetos através de duas modais integradas (`SalvarEmListaModal` e `MinhasListasModal`), store reativa Pinia com persistência local, link público compartilhado, integração com WhatsApp e botões nos cards e na navbar.

### Modified Capabilities
<!-- Nenhuma especificação de requisitos base do catálogo foi alterada, apenas a extensão visual e os gatilhos das modais. -->

## Impact

- **Frontend (`frontend/src/`)**:
  - Novos componentes: `src/components/listas/SalvarEmListaModal.vue` e `src/components/listas/MinhasListasModal.vue`.
  - Nova store: `src/stores/listas.ts`.
  - Novos tipos de dados em `src/types/listas.ts` exportados pelo barrel `src/types/index.ts`.
  - Componentes modificados: `src/components/layout/AppNavbar.vue`, `src/components/catalogo/CatalogProductCard.vue`, `src/views/HomeView.vue` e `src/views/ProdutoDetalheView.vue`.
- **Dependências / Backend**: Nenhuma alteração no backend ou banco de dados; execução 100% no cliente nesta etapa.
