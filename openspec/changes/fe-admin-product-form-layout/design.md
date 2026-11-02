## Context

Hoje o formulário de produto se divide em `views/admin/produtos/ProdutoForm.vue` (438 linhas, estado das etapas e validação), `ProdutoTelaLayout.vue` (312, moldura e painel de envio), `ProdutoFormNavegacao.vue` (282, indicador lateral e rodapé escolhidos pela prop `parte`) e as seções em `components/admin/produtos/`, onde `ProdutoPrecoDimensoesSection` cobre duas etapas e as etapas 4, 5 e 6 repetem o cartão inline. Componentes são auto-importados (`components.d.ts`). A change `fe-admin-product-form` segue ativa e não é alterada.

## Goals / Non-Goals

**Goals:**
- Um único `ProdutoForm.vue` com moldura, indicador fixo, cartão da etapa, rodapé fixo e painel de envio.
- Uma etapa por componente, numerada, em `components/admin/produtos/etapas/`.
- Etapa 1 sem rolagem em 1366×768.
- Menos linhas no total: meta de ~350–450 para `ProdutoForm.vue` e nenhuma marcação duplicada.

**Non-Goals:**
- Mudar regras, validações, API, tipos ou textos de negócio.
- Mexer na listagem além de mover arquivos.

## Decisions

- **Formulário único em `views/`.** `ProdutoForm.vue` continua em `views/admin/produtos/` e absorve moldura e navegação. Alternativa descartada: separar stepper, rodapé e cartão em componentes próprios; o usuário preferiu um arquivo só, e são blocos curtos sem reuso fora do formulário.
- **Estados de carga no formulário.** Os props de carga, erro, "não encontrado" e envio que hoje vão para `ProdutoTelaLayout` passam a ir para `ProdutoForm`; as views deixam de usar duas camadas.
- **Cartão único com metadados.** Número, título e orientação de cada etapa vêm de `FORM_SECTIONS` (acrescentar a orientação lá); o template escreve o cabeçalho uma vez e renderiza a etapa atual com `v-if`, um por etapa, na ordem da tela.
- **Nomes numerados.** `Etapa1DadosBasicos`, `Etapa2Preco`, `Etapa3Dimensoes`, `Etapa4Variacoes` (+ `Etapa4VariacaoAcabamento`, `Etapa4VariacaoAmostra`), `Etapa5Fotos`, `Etapa6Especificacoes`; `KeyValueEditor` fica em `etapas/` com o nome atual porque as etapas 4 e 6 o usam. Nome de componente não pode começar com dígito, por isso o prefixo `Etapa`; os filhos levam o número da etapa para ordenar no editor.
- **Indicador sem versão dupla.** Uma única marcação horizontal; em telas estreitas os títulos das etapas não atuais ficam ocultos via classe responsiva. Fixo com `sticky` e `top` igual à altura do `AppNavbar`: 112 px no celular (`top-28`) e 80 px a partir de `md` (`top-20`).
- **Rodapé `sticky bottom-0`** dentro do `<form>`, com fundo e borda superior.
- **Etapas recebem `v-model="form"`, `errors` e `locked`**, mais só o que cada uma usa; nada de props genéricas não usadas.
- **Sem imports manuais** de componentes auto-importados. `ProdutoForm` mora em `views/`, fora do auto-import, e segue importado pelas duas telas.
- **Props derivadas do modo.** `modo` (`novo` | `editar`) substitui `stepsUnlocked`, `submitLabel` e os textos de carga, volta e falha que as telas passavam à moldura.

## Risks / Trade-offs

- [`ProdutoForm.vue` cresce ao absorver dois arquivos] → as etapas saem do arquivo e o cartão é escrito uma vez; se passar de ~450 linhas, extrair a lógica das etapas para um composable `useProdutoFormEtapas` em `composables/`.
- [Altura do navbar muda entre breakpoints] → `top` responsivo com as alturas medidas; se o `AppNavbar` mudar de altura, o indicador precisa acompanhar.
- [Mover arquivos quebra o auto-import ou deixa nome duplicado] → regenerar `components.d.ts` e rodar o type-check.
- [Conflito com a change ativa `fe-admin-product-form`] → implementar depois de arquivá-la, ou rebasear no fim dela.
