## Context

Atualmente, o frontend possui elementos visuais que sugerem listas e salvamento de favoritos (botões "Salvos" na navbar e botões de favoritar na Home e na página de detalhes), porém todos operam apenas como stubs locais ou links vazios. Conforme os requisitos RF08, RF09, RF10 e RF12 do PRD, os clientes e arquitetos precisam gerenciar listas permanentes e pastas personalizadas de ambientes e salvar produtos diretamente do catálogo.

Esta mudança foca exclusivamente na camada de frontend, estruturando o comportamento em um sistema de duas modais interativas e reativas, eliminando a necessidade de redirecionar o usuário para páginas dedicadas e mantendo sua navegação contínua no catálogo.

## Goals / Non-Goals

**Goals:**
- Implementar o modal reutilizável `SalvarEmListaModal.vue` para adicionar móveis a uma ou mais listas, com suporte a criação rápida de novas pastas e captura da variação de acabamento.
- Implementar o modal central `MinhasListasModal.vue` com navegação Master-Detail em dois níveis:
  - **Nível 1**: Listagem limpa e compacta de todas as pastas com contadores e identificadores de sistema/customizada.
  - **Nível 2**: Detalhamento dos móveis da pasta selecionada, com remoção, totalizador financeiro, botão de cópia de link público e solicitação de orçamento via WhatsApp.
- Criar a store Pinia `useListasStore` com as 3 listas padrão obrigatórias (**Favoritos**, **Lista de Desejos** e **Lista de Presentes**), regras estritas de proteção contra exclusão/renomeação e persistência em `localStorage`.
- Integrar os pontos de contato da interface: botão de coração nos cards do catálogo (`CatalogProductCard.vue`), botão de salvar na página de produto (`ProdutoDetalheView.vue`) e botões de "Salvos" no `AppNavbar.vue`.
- Reutilizar estritamente os componentes do Design System (`<UiModal>`, `<UiButton>`) e os tokens de cores do projeto.

**Non-Goals:**
- Nenhuma alteração no backend (`backend/`) ou nas migrações do banco de dados PostgreSQL nesta branch.
- Criação de telas/rotas completas exclusivas para listas (o fluxo é 100% modal).
- Criação da tela administrativa de consulta de listas por vendedor em tablet (RF11 / US-FE-13), que será tratada em tarefa posterior.

## Decisions

### Decisão 1: Arquitetura em Modais em vez de Páginas Dedicadas
- **Escolha**: Manter todo o fluxo de visualização e salvamento em modais sobrepostas (`SalvarEmListaModal` e `MinhasListasModal`).
- **Alternativa Rejeitada**: Criar uma página `/minhas-listas` e navegar para fora do catálogo.
- **Justificativa**: Em e-commerce de móveis e alta decoração, o cliente frequentemente pesquisa dezenas de itens. Redirecionar para outra rota faz o usuário perder o scroll, os filtros ativos e o fluxo de compra. A modal permite inspecionar pastas ou salvar itens e continuar exatamente de onde parou.

### Decisão 2: Navegação Master-Detail em Dois Níveis no `MinhasListasModal`
- **Escolha**:
  - Nível 1: Lista vertical limpa com o nome da pasta, contador de móveis, badge informativa e botão para abrir a pasta.
  - Nível 2: Desliza para o detalhe da pasta com botão de retorno ("← Voltar para Minhas Pastas"), ações de pasta (renomear, excluir, link público, WhatsApp) e grid de produtos.
- **Alternativa Rejeitada**: Abas horizontais no topo para todas as pastas.
- **Justificativa**: Abas horizontais quebram ou exigem rolagem horizontal desconfortável quando o usuário cria 5 ou 10 pastas personalizadas para clientes/ambientes. A navegação em dois níveis é infinitamente escalável no desktop e no mobile.

### Decisão 3: Lista de Pastas Limpa no Nível 1 (Sem Mosaico de Miniaturas)
- **Escolha**: Exibir apenas nome, tipo e contadores no Nível 1, deixando a exibição de fotos exclusivamente para o Nível 2.
- **Justificativa**: Conforme alinhamento, simplifica o carregamento, evita poluição visual no Nível 1 e garante uma visualização executiva e objetiva das pastas.

### Decisão 4: Store Pinia Reativa com Persistência em `localStorage`
- **Escolha**: Centralizar o estado em `src/stores/listas.ts`, persistindo o JSON com chave versionada (`emporio_henz_listas_v1`).
- **Justificativa**: Permite que o usuário teste a adição de móveis, criação de pastas, remoção de itens e recarregamento da página sem depender de APIs ou banco de dados no momento. As assinaturas dos métodos espelham exatamente o futuro contrato da API REST (`addToList`, `removeFromList`, `createList`, `renameList`, `deleteList`).

### Decisão 5: Estrutura dos Tipos e Modelos
- **Definição**:
  ```ts
  export interface SavedItem {
    id: string; // ID único do item na lista
    productId: string;
    productSlug?: string;
    name: string;
    price: number;
    image: string;
    finishLabel?: string;
    finishColor?: string;
    addedAt: string;
  }

  export interface UserList {
    id: string;
    name: string;
    isSystem: boolean; // true para Favoritos, Desejos, Presentes
    shareSlug: string; // UUID de compartilhamento público
    items: SavedItem[];
  }
  ```

## Risks / Trade-offs

- **[Risco] Concorrência entre múltiplos modais abertos simultaneamente**
  → *Mitigação*: Os modais compartilham estado via store Pinia e controlam visibilidade de forma que abrir o gerenciador a partir do modal de salvamento fecha o primeiro antes de exibir o segundo.
- **[Risco] Responsividade e altura do modal com muitos itens salvos**
  → *Mitigação*: Utilização de rolagem interna (`overflow-y-auto`) na área de produtos do Nível 2 com cabeçalho e rodapé fixos no modal (`<UiModal maxWidth="4xl">`).
- **[Risco] Exclusão acidental de pasta personalizada com móveis**
  → *Mitigação*: Exigir confirmação visual (alerta ou modal de confirmação) antes de remover permanentemente uma pasta customizada e seus itens do estado local.
