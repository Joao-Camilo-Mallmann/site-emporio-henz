## MODIFIED Requirements

### Requirement: Grid de Produtos e Card com Indicador de Acabamentos
The catalog MUST render products in a responsive grid using cards conforming to Figma `#12:2374` com 1:1 image, finishes badge, furniture name, price in highlight, installment condition, and clicking the card MUST navigate to the product detail view `/produtos/:id`.

#### Scenario: Exibição correta do card de produto
- **WHEN** o grid renderiza um produto com múltiplas variações de acabamento
- **THEN** o card exibe a imagem principal com cantos superiores arredondados, a pílula de acabamentos com círculos de cor no canto inferior direito da foto, o nome do móvel, o preço formatado em reais com centavos menores e a legenda "Até 10x no cartão"

#### Scenario: Clique no card redireciona para a página de detalhes
- **WHEN** o usuário clica sobre qualquer área interativa do card de produto no catálogo
- **THEN** a aplicação navega para a rota `/produtos/:id` correspondente ao produto selecionado
