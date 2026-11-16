## MODIFIED Requirements

### Requirement: Desacoplamento para Parâmetros GET e Paginação Futura
The catalog MUST load products exclusively from `GET /produtos` with server-side pagination and filters, translating the URL state into the API contract (`page`, `limit`, `search`, `categoryId`, `subtypeId`, `availabilityType`, `minPrice`, `maxPrice`). It MUST NOT filter, sort or paginate in memory and MUST NOT use mocked fallback data.

#### Scenario: Estrutura preparada para parâmetros GET
- **WHEN** a URL é `/catalogo?categoria=quarto&disponibilidade=IN_STOCK&minPreco=1000&page=2`
- **THEN** o sistema resolve o slug `quarto` para o `categoryId` correspondente e requisita `GET /produtos?categoryId=<uuid>&availabilityType=IN_STOCK&minPrice=1000&page=2&limit=9`

#### Scenario: Despacho de requisição GET sem filtragem em memória no cliente
- **WHEN** o usuário seleciona ou altera qualquer filtro no catálogo
- **THEN** a URL é atualizada, a página volta para 1 e a view despacha a requisição `GET /produtos`, renderizando exatamente os itens e a paginação retornados pela API

#### Scenario: Parâmetros que não são filtro são preservados
- **WHEN** a URL contém um parâmetro que não é filtro (ex.: `?utm_source=whatsapp`) e o usuário altera um filtro
- **THEN** o parâmetro permanece na URL

#### Scenario: Categoria inexistente na URL
- **WHEN** a URL traz `categoria` com um slug que não corresponde a nenhuma categoria ativa
- **THEN** o catálogo exibe o estado vazio sem requisitar produtos de outras categorias

#### Scenario: Falha ao carregar produtos
- **WHEN** a requisição `GET /produtos` falha
- **THEN** o catálogo exibe uma mensagem de erro com o botão "Tentar novamente", que repete a requisição

#### Scenario: Navegação de paginação modular
- **WHEN** o componente de paginação recebe a página atual e o total de páginas da API
- **THEN** ele emite eventos de troca de página que atualizam `?page=` e recarregam a listagem
