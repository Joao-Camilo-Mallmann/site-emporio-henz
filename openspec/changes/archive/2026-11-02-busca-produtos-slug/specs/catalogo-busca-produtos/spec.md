## MODIFIED Requirements

### Requirement: Integração com a Busca e Categorias da Navbar
The global navigation bar (`AppNavbar.vue`) MUST redirect textual searches and category navigation to the catalog page `/catalogo`, passing the corresponding query parameters in the URL. The search term MUST be sent in the URL as typed, only trimmed and with repeated whitespace collapsed, and the catalog API layer MUST send it to the backend normalized as a slug (no accents, lowercase, every run of non-alphanumeric characters reduced to a single hyphen, no leading or trailing hyphen) in the `search` parameter. The mocked fallback MUST filter products with the same normalization on both sides.

#### Scenario: Usuário digita na busca da navbar e pressiona enter
- **WHEN** o usuário digita "Roupeiro" no campo de busca da navbar e submete o formulário
- **THEN** o sistema redireciona para `/catalogo?name=Roupeiro` e a página carrega exibindo o termo pesquisado

#### Scenario: Termo com acento, caixa alta e underline
- **WHEN** o usuário digita "ROUPEIRO_ROMÃ" na busca da navbar e submete o formulário
- **THEN** o resumo da página mostra “ROUPEIRO_ROMÃ”, a API recebe `search=roupeiro-roma` e o produto "Roupeiro Roma" aparece nos resultados

#### Scenario: Usuário clica em uma categoria na sub-navbar
- **WHEN** o usuário clica em "Quarto" na barra secundária de navegação
- **THEN** o sistema navega para `/catalogo?categoria=quarto` com o filtro de categoria selecionado
