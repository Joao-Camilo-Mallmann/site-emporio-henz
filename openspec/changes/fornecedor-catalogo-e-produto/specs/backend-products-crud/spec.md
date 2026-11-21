# Delta Spec: backend-products-crud

## MODIFIED Requirements

### Requirement: Listagem Paginada e Consulta Detalhada de Produtos
O sistema MUST incluir o campo `supplierName` (`string | null`, obtido por `LEFT JOIN` com fornecedores não deletados) em todos os itens retornados por `GET /api/v1/produtos`, `GET /api/v1/produtos/:id`, `GET /api/v1/produtos/:id/recomendados`, `POST /api/v1/produtos` e `PUT /api/v1/produtos/:id`.

#### Scenario: Listagem e detalhe trazem o nome do fornecedor
- **WHEN** um visitante ou usuário autenticado chama `GET /api/v1/produtos` ou `GET /api/v1/produtos/:id`
- **THEN** cada produto retornado MUST conter `supplierId` e `supplierName` com o nome do fornecedor vinculado (ou `null` caso o fornecedor tenha sido removido logicamente), sem expor o campo `contact` do fornecedor
