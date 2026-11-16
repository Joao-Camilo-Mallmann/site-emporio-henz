## 1. [FE] Etapas numeradas

- [x] 1.1 Criar `components/admin/produtos/etapas/` e mover `ProdutoDadosBasicosSection` para `Etapa1DadosBasicos`, com nome + slug em 2 colunas, categoria/subtipo/fornecedor em grade e descrição de 3 linhas
- [x] 1.2 Dividir `ProdutoPrecoDimensoesSection` em `Etapa2Preco` e `Etapa3Dimensoes` e remover o original
- [x] 1.3 Mover variações para `Etapa4Variacoes`, `Etapa4VariacaoAcabamento` e `Etapa4VariacaoAmostra`
- [x] 1.4 Mover fotos para `Etapa5Fotos`
- [x] 1.5 Criar `Etapa6Especificacoes` com a ficha técnica e o "Produto ativo no catálogo"; mover `KeyValueEditor` para `etapas/` (compartilhado pelas etapas 4 e 6)
- [x] 1.6 Acrescentar a orientação de cada etapa em `FORM_SECTIONS`

## 2. [FE] Formulário único

- [x] 2.1 Incorporar a moldura e os estados de carga, erro, "não encontrado" e envio de `ProdutoTelaLayout` em `ProdutoForm.vue` e remover `ProdutoTelaLayout.vue`
- [x] 2.2 Criar `components/ui/UiStepper.vue` (indicador de etapas horizontal, props em `UiStepperProps`) e usá-lo no `ProdutoForm` como `sticky` abaixo do `AppNavbar` (títulos ocultos em telas estreitas exceto o atual)
- [x] 2.7 Documentar o `UiStepper` em `frontend/agents.md` e `docs/frontend/README.md`
- [x] 2.3 Incorporar rodapé `sticky bottom-0` e remover `ProdutoFormNavegacao.vue`
- [x] 2.4 Escrever o cabeçalho do cartão uma vez e renderizar a etapa atual com um `v-if` por etapa
- [x] 2.5 Ocultar indicador e rodapé durante o envio dos arquivos, como hoje
- [x] 2.6 Avaliar a extração da lógica das etapas para composable: dispensada, `ProdutoForm.vue` ficou em 466 linhas, dentro do limite de 500

## 3. [FE] Telas e listagem

- [x] 3.1 Simplificar `ProdutoNewView` e `ProdutoEditView` para carregar dados, chamar a API e renderizar só `<ProdutoForm>` (o import de `ProdutoForm` continua, porque ele mora em `views/` e não é auto-importado)
- [x] 3.2 Incorporar `ProdutoListCabecalho` e `ProdutoListTabela` em `ProdutoListView.vue` e remover os dois arquivos
- [x] 3.4 Atualizar o mapa de arquivos em `docs/frontend/README.md`
- [x] 3.5 Conferir a listagem no navegador: filtros, busca, estado vazio, limpar filtros, edição e modal de desativação
- [x] 3.3 Regenerar `components.d.ts` e conferir que não há nome de componente duplicado nem código morto

## 4. [FE] Validação

- [x] 4.1 Rodar type-check e lint do frontend com Bun (o frontend não tem script de testes)
- [x] 4.2 Conferir no navegador: etapa 1 sem rolagem em 1366×768, indicador e rodapé fixos nas etapas 4 e 5, indicador compacto em 375px
- [x] 4.3 Conferir no navegador a validação com foco no primeiro erro, a etapa com erro marcada, etapas bloqueadas no cadastro e livres na edição
- [x] 4.4 Conferir ponta a ponta o erro da API, o envio de arquivos e o reenvio por arquivo
