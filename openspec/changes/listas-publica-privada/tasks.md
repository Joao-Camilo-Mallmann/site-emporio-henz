## 1. Backend

- [x] 1.1 `[BE]` Criar `backend/database/migrations/016_lists_private_by_default.sql` (padrão `FALSE` e listas existentes privadas)
- [x] 1.2 `[BE]` `validateShare` em `lists.schema.ts`, `setPublic` em repository, service e controller, rota `PATCH /:id/compartilhamento`
- [x] 1.2.1 `[BE]` `GET /listas` paginado no envelope `{ data, pagination }` (`validateListQuery`, `listPageByClient`), e store do front percorrendo as páginas
- [x] 1.3 `[BE]` Testes em `backend/tests/modules/lists/` (padrão privado, ligar/desligar, lista alheia, corpo inválido) e `bun test` verde

## 2. Frontend

- [x] 2.1 `[FE]` `isPublic` em `UserList`, `alterarCompartilhamento` na API e `setListPublic` na store; a store recarrega as listas ao trocar de conta (antes só ao entrar ou sair)
- [x] 2.2 `[FE]` Botão Privada/Pública, link com "Copiar link" e WhatsApp sem link quando privada em `MinhasListasModal.vue`; mensagem de lista privada no link compartilhado
- [x] 2.3 `[FE]` Página `/lista/:shareSlug` (`ListaCompartilhadaView.vue`), remoção de `ListaCompartilhadaModal.vue` e do estado na store, tablet aceitando só `/lista/<uuid>`

## 3. Documentação

- [x] 3.1 Atualizar PRD (RF10 e UC06 A1), `docs/backend/README.md` e a collection Bruno (`Lists/Set List Sharing.bru`)

## 4. Verificação

- [x] 4.1 `[BE]` `bun run lint` e `bun test` no `backend` (lint acusa 2 erros anteriores a esta change: `database/seed.ts` e o import de `isValidUuid` em `lists.service.ts`)
- [x] 4.2 `[FE]` `bun run lint`, `bun run check-types` e `bun run build` no `frontend` (build gerado fora de `dist/`, que pertence ao root por causa do Docker)
- [x] 4.3 Conferir no navegador: lista nasce privada, link dá "privada", tornar pública e copiar, abrir deslogado, voltar a privada
- [x] 4.4 Conferir `/lista/<uuid>` pública, privada e UUID inválido
