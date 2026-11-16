## Why

O PRD (RF10, UC05) prevê que o cliente gere um link público somente-leitura para uma lista. Hoje o banco já tem `lists.share_slug` e `lists.is_public`, e `GET /listas/compartilhadas/:shareSlug` só responde para listas públicas. Mas:

- `is_public` nasce `TRUE`, então toda lista fica acessível a quem tiver o UUID, sem o cliente ter escolhido compartilhar.
- Não existe rota para mudar `is_public`, e o front não mostra se a lista é pública nem deixa trocar. O botão "Copiar Link" copia um link que o cliente não controla.

## What Changes

- **Banco**: migração `016_lists_private_by_default.sql` muda o padrão de `is_public` para `FALSE` e torna privadas as listas existentes. **BREAKING**: links já enviados param de abrir até o cliente tornar a lista pública.
- **Back**: nova rota `PATCH /api/v1/listas/:id/compartilhamento` com `{ "isPublic": boolean }`, só para o dono, válida também para as listas padrão. Resposta: a lista atualizada.
- **Front** (`MinhasListasModal.vue`): botão Privada/Pública em cada lista. Quando pública, mostra o link e o botão "Copiar link". Quando privada, não há link. O pedido de orçamento no WhatsApp só leva o link se a lista for pública.
- **Front, página própria**: a lista compartilhada deixa de ser um modal sobre o catálogo (`/catalogo?lista=<uuid>`) e passa a ter a rota `/lista/:shareSlug` (`ListaCompartilhadaView.vue`), que mostra o que `GET /listas/compartilhadas/:shareSlug` devolve. O formato `/catalogo?lista=<uuid>` deixa de existir (sem redirecionamento). O `ListaCompartilhadaModal.vue` e o estado dele na store saem. O tablet de atendimento aceita só o link novo.
- **Docs**: PRD (RF10, UC06 A1), `docs/backend/README.md` e collection Bruno.

## Capabilities

### New Capabilities

- `backend-listas-compartilhamento`: visibilidade da lista (privada por padrão) e rota para o dono ligar/desligar o link público.

### Modified Capabilities

- `fe-modais-listas`: o requisito de compartilhamento passa a ter o controle Privada/Pública, e a lista compartilhada ganha página própria.
- `catalogo-busca-produtos`: o catálogo deixa de tratar `?lista=`.

## Impact

- `backend/database/migrations/016_lists_private_by_default.sql` (novo)
- `backend/src/modules/lists/` (routes, controller, service, repository, schema)
- `backend/tests/` (mock e testes de listas)
- `frontend/src/types/listas.ts`, `frontend/src/api/listas.ts`, `frontend/src/stores/listas.ts`, `frontend/src/components/listas/MinhasListasModal.vue`, `frontend/src/views/listas/ListaCompartilhadaView.vue` (novo), `frontend/src/router/index.ts`, `frontend/src/App.vue`, `frontend/src/views/admin/AtendimentoTabletView.vue`; remove `ListaCompartilhadaModal.vue`
- `docs/PRD.md`, `docs/backend/README.md`, `docs/backend/collections/bruno/Lists/`
