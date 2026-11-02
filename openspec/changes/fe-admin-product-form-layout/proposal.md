## Why

O formulário de produto do painel (cadastro e edição) não cabe na tela: o indicador de etapas ocupa uma coluna lateral, os campos ficam empilhados e os botões caem abaixo da dobra. O código também está espalhado: `ProdutoForm.vue` mora em `views/` sem ser página, a moldura e a navegação vivem em arquivos separados, duas etapas dividem um componente e o cabeçalho do cartão é copiado à mão em três etapas.

## What Changes

- **[FE]** Um único componente de formulário, `views/admin/produtos/ProdutoForm.vue`, absorve `ProdutoTelaLayout.vue` e `ProdutoFormNavegacao.vue`: moldura da tela, indicador de etapas horizontal fixo no topo, cartão único da etapa, rodapé fixo e painel de envio dos arquivos.
- **[FE]** `ProdutoNewView` e `ProdutoEditView` só carregam dados, chamam a API e renderizam `<ProdutoForm>`. As diferenças entre cadastro e edição passam por props.
- **[FE]** Uma etapa por componente em `components/admin/produtos/etapas/`, com o número no nome (`Etapa1DadosBasicos` … `Etapa6Especificacoes`). `ProdutoPrecoDimensoesSection` é dividido em `Etapa2Preco` e `Etapa3Dimensoes`; o "Produto ativo" entra na etapa 6.
- **[FE]** Componentes da listagem em `components/admin/produtos/listagem/`.
- **[FE]** Layout compacto: a etapa 1 cabe numa tela de notebook sem rolagem; nas etapas longas só o conteúdo do cartão rola.
- **[FE]** Código enxuto: sem marcação duplicada, sem código morto e sem imports manuais de componentes auto-importados.
- Sem mudança de regra de negócio, de API ou de PRD. Validação, foco no primeiro erro, envio de arquivos em fases e edição com etapas livres continuam iguais.

## Capabilities

### New Capabilities
- `admin-produto-form-layout`: layout e organização do formulário de produto do painel (indicador de etapas fixo, uma etapa por vez em cartão único, rodapé fixo, layout compacto e responsivo), compartilhado por cadastro e edição.

### Modified Capabilities
<!-- Nenhuma: `admin-cadastro-produtos` ainda está na change ativa `fe-admin-product-form` e não muda de requisito. -->

## Impact

- `frontend/src/views/admin/produtos/` (`ProdutoForm`, `ProdutoNewView`, `ProdutoEditView`, `ProdutoListView`).
- `frontend/src/components/admin/produtos/`: reorganizado em `etapas/` e `listagem/`; `ProdutoTelaLayout.vue`, `ProdutoFormNavegacao.vue` e `ProdutoPrecoDimensoesSection.vue` são removidos.
- `frontend/src/components.d.ts` regenerado pelo auto-import.
- Nenhum impacto em backend, banco, collection Bruno ou PRD.
