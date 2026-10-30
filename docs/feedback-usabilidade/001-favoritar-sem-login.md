# 001 · Favoritar produto sem estar logado

| Campo      | Valor                                       |
| ---------- | ------------------------------------------- |
| Data       | 2026-10-29                                  |
| Status     | resolvido                                   |
| Severidade | alta                                        |
| Camada     | [FE] (e conferir [BE])                      |
| Tela       | Home (Destaques), catálogo, detalhe do produto |
| Referência | PRD UC04 (pré-condição e fluxo A1), RF09    |

## O que acontece

Um visitante não autenticado clica no coração do card e o produto aparece como salvo (coração vermelho). Nenhum convite para entrar ou se cadastrar é exibido.

## O que deveria acontecer

Pelo PRD, UC04 tem como pré-condição "Cliente autenticado no portal". O fluxo alternativo **A1** diz que, sem autenticação, o clique em salvar abre um modal convidando a entrar ou se cadastrar, guarda o produto em memória e conclui o salvamento logo após o login.

## Como reproduzir

1. Abrir o site sem sessão (aba anônima), no celular.
2. Na seção "Destaques" da home, tocar no coração de qualquer card.
3. Escolher uma lista no modal: o coração fica vermelho.

## Notas técnicas

- `frontend/src/stores/listas.ts`: `openSaveModal` abre o modal de destino sem checar `useAuthStore().isAuthenticated`. As listas vivem em `localStorage` (`emporio_henz_listas_v1`), sem vínculo com usuário, então qualquer visitante "salva".
- `frontend/src/components/catalogo/CatalogoProdutoCard.vue` (`handleSaveClick`) chama o store direto; o mesmo vale para `CatalogoProdutoDetalheView.vue` e `CatalogoProdutoGaleria.vue`.
- Correção sugerida: verificar a sessão no `openSaveModal`, abrir o convite de login quando não houver, guardar o `activeProductToSave` e retomar o salvamento depois do login.
- Conferir também se as listas já são persistidas na API por usuário. Se ainda não forem, o problema é maior que o guard de UI: os itens salvos não seguem o cliente entre dispositivos nem ficam visíveis para o vendedor (UC06).

## Correção

- `stores/listas.ts`: `openSaveModal` sem sessão guarda o produto em `pendingProductToSave` e abre o convite de login; um `watch` em `isAuthenticated` reabre o modal de salvar com esse produto depois do login. O coração do header ("Minhas listas") também abre o convite. Visitante não vê corações marcados nem contador de salvos.
- `SalvarEmListaModal.vue`: novo modal "Entre para salvar seus móveis", com "Entrar" e "Criar conta", que levam a `/login` ou `/cadastro` com `?redirect=` da página atual.
- `LoginView.vue` e `RegisterView.vue`: alternar entre login e cadastro mantém o `redirect`.
- Validado no navegador (375px): visitante vê o convite, vai para `/login?redirect=/`, entra e o modal de salvar reabre com o mesmo produto.
- 2026-10-29: o servidor publicado (`177.44.248.90`) ainda roda a versão anterior. O print do [004](./004-botoes-flutuantes-sobre-cards.md) mostra o coração marcado na "Mesa de Centro"; se a sessão estava deslogada, é este achado. Conferir de novo após o deploy desta branch.
- Pendente fora deste achado: as listas continuam só no `localStorage`, sem vínculo com o usuário na API (ver notas técnicas).

## Print

![Card com coração marcado sem sessão ativa](./prints/001-favoritar-sem-login.webp)
