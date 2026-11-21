# Delta Spec: tela-detalhes-produto

## MODIFIED Requirements

### Requirement: Exibição do Fornecedor na Página de Detalhe do Produto
The product detail view (`/catalogo/:slug`) SHALL display the product's supplier (`supplierName`) near the product title as an interactive link (`<UiButton variant="link" size="none">`) navigating to `/catalogo?fornecedor=<slug>` and SHALL also include a "Fornecedor" row in the technical specifications table when `supplierName` is present.

#### Scenario: Exibição e clique no fornecedor na página do produto
- **WHEN** o usuário acessa `/catalogo/:slug` de um produto com `supplierName` preenchido
- **THEN** a página exibe o fornecedor abaixo do título e na tabela de especificações técnicas
- **WHEN** o usuário clica no nome do fornecedor abaixo do título
- **THEN** a aplicação navega para `/catalogo?fornecedor=<slug>` exibindo os produtos daquele fornecedor
