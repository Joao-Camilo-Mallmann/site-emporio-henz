# admin-produto-form-layout Specification

## Purpose
TBD - created by archiving change fe-admin-product-form-layout. Update Purpose after archive.
## Requirements
### Requirement: Formulário único para cadastro e edição
O painel SHALL usar um único componente de formulário de produto para `/admin/produtos/novo` e `/admin/produtos/:id/editar`. As telas de cadastro e edição MUST apenas carregar dados, chamar a API e renderizar esse componente, variando o comportamento só por props.

#### Scenario: Cadastro usa o formulário único
- **WHEN** o usuário abre `/admin/produtos/novo`
- **THEN** a tela exibe o formulário único com as etapas liberadas em sequência e o botão "Salvar produto" na última etapa

#### Scenario: Edição usa o mesmo formulário
- **WHEN** o usuário abre `/admin/produtos/:id/editar`
- **THEN** a tela exibe o mesmo formulário preenchido, com todas as etapas livres e o botão de salvar em todas

### Requirement: Indicador de etapas horizontal fixo
O formulário SHALL exibir as seis etapas numeradas num indicador horizontal acima do cartão, fixo logo abaixo da barra de navegação do site durante a rolagem. Em telas estreitas, o indicador MUST mostrar os círculos numerados e o título só da etapa atual.

#### Scenario: Indicador permanece visível
- **WHEN** o usuário rola uma etapa longa (variações ou fotos)
- **THEN** o indicador de etapas continua visível no topo, abaixo da barra de navegação

#### Scenario: Navegação pelo indicador
- **WHEN** o usuário clica numa etapa já liberada
- **THEN** o formulário mostra essa etapa; etapas ainda bloqueadas não respondem ao clique

#### Scenario: Indicador no celular
- **WHEN** a largura da tela é de celular
- **THEN** o indicador mostra os seis círculos numerados e o título da etapa atual, sem rolagem horizontal da página

### Requirement: Uma etapa por vez em cartão único
O formulário SHALL mostrar uma etapa por vez dentro de um único cartão, com número, título e orientação da etapa. A etapa 6 MUST reunir as especificações técnicas e a opção "Produto ativo no catálogo".

#### Scenario: Troca de etapa
- **WHEN** o usuário avança com "Próximo" e a etapa atual é válida
- **THEN** o cartão passa a mostrar a etapa seguinte, com o número e o título dela

#### Scenario: Status na última etapa
- **WHEN** o usuário está na etapa 6
- **THEN** o cartão mostra a ficha técnica e a opção "Produto ativo no catálogo"

### Requirement: Rodapé de ações fixo
O formulário SHALL manter o rodapé com Cancelar, "Etapa X de 6", Voltar, Próximo e Salvar fixo na base da tela enquanto o formulário estiver visível. Durante o envio dos arquivos, indicador e rodapé MUST ficar ocultos, como hoje.

#### Scenario: Ações sempre ao alcance
- **WHEN** a etapa atual é mais alta que a tela
- **THEN** o rodapé com as ações continua visível na base da tela

### Requirement: Layout compacto da etapa 1
A etapa 1 (dados básicos) SHALL caber sem rolagem numa tela de notebook (1366×768), com nome e slug lado a lado, categoria, subtipo e fornecedor em grade e descrição com três linhas.

#### Scenario: Etapa 1 sem rolagem
- **WHEN** o usuário abre o cadastro numa tela de 1366×768
- **THEN** todos os campos da etapa 1, o indicador e o rodapé aparecem sem rolar a página

### Requirement: Comportamento do formulário preservado
A reorganização MUST manter a validação no navegador, o foco no primeiro campo com erro, a marcação de etapas com erro no indicador, os erros vindos da API e o envio dos arquivos em fases com reenvio por arquivo.

#### Scenario: Erro leva à etapa certa
- **WHEN** o usuário tenta salvar com um campo inválido numa etapa anterior
- **THEN** o formulário abre essa etapa, marca-a com erro no indicador e foca o campo

