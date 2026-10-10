## Context

O backend do Empório Henz padronizou todas as rotas de listagem para seguirem o RNF11 (`backend/src/lib/pagination.ts`), retornando o envelope `{ data: T[], pagination: { page, limit, total, totalPages } }`. A collection Bruno em `docs/backend/collections/bruno/Suppliers/List Suppliers.bru` já reflete exatamente este contrato.
No frontend, enquanto a tela de usuários (`UsuarioListView.vue`) já implementou a paginação server-side com sucesso, a tela de fornecedores (`FornecedorListView.vue`) e sua API (`fornecedoresApi.ts`) permaneceram com a tipagem e chamada legadas (esperando array puro `ISupplier[]`), o que causa quebra em tempo de execução.

## Goals / Non-Goals

**Goals:**
- Alinhar os tipos do módulo de fornecedores (`frontend/src/types/suppliers.ts`) com o contrato do backend (`SupplierFilterParams`, `PaginatedSuppliersResponse`).
- Ajustar `fornecedoresApi.listar` para repassar parâmetros de consulta (`page`, `limit`, `search`, `active`) e retornar a resposta paginada.
- Refatorar `FornecedorListView.vue` para consumir o envelope paginado, eliminar o erro de `.filter` e oferecer controles de paginação (Anterior/Próxima, contador de registros) padronizados com o restante do painel administrativo (`UsuarioListView.vue`).

**Non-Goals:**
- Modificações em rotas de backend ou migrações de banco (já implementados e em conformidade).
- Alterações em telas públicas de catálogo ou no catálogo mockado.

## Decisions

### 1. Espelhamento do Padrão de UX de `UsuarioListView.vue`
- **Decisão:** Replicar a mesma experiência de usuário e estilos utilizados na tela de Usuários para a paginação da tabela de Fornecedores (`Página X de Y (Z registros)`, botões Anterior e Próxima desabilitados nos limites).
- **Alternativa descartada:** Criar um novo componente de paginação global neste momento (o que poderia desestabilizar outras telas do sistema sem necessidade).

### 2. Tratamento da Busca Textual
- **Decisão:** A busca (`searchTerm`) passa a ser enviada ao backend via parâmetro `search`, disparando `carregarFornecedores(1)` no evento `keyup.enter` ou ao perder foco / clicar em buscar, garantindo que o servidor filtre no banco de dados com `escapeLike` e reinicie na página 1.

### 3. Exibição de Métricas no Cabeçalho
- **Decisão:** Substituir o cálculo client-side de `totalActive` pelo total geral retornado pela paginação do backend (`response.pagination.total`), mantendo informação confiável e sem distorção por página.

## Risks / Trade-offs

- **[Busca por enter vs em tempo real]** → Como a lista é paginada no servidor, a busca em tempo real a cada caractere sem debounce causaria excesso de requisições. Mitigação: disparar busca ao pressionar Enter ou permitir botão/debounce limpo.
