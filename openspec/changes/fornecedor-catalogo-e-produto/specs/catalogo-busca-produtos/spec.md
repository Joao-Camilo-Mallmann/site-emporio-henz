# Delta Spec: catalogo-busca-produtos

## MODIFIED Requirements

### Requirement: Barra Lateral de Filtros Alimentada pela API
The catalog filter sidebar MUST include a **Fornecedor** section populated from `GET /api/v1/suppliers` (active suppliers), synchronized with the URL query parameter `?fornecedor=<slug>` (also accepting UUID) and translated to `supplierId` in `GET /api/v1/produtos`.

#### Scenario: Filtragem por fornecedor na barra lateral
- **WHEN** o usuário seleciona o chip de um fornecedor na barra lateral do catálogo
- **THEN** a URL é atualizada com `?fornecedor=<slug>`, a página volta para 1 e o catálogo requisita `GET /api/v1/produtos?supplierId=<uuid>`

#### Scenario: Fornecedor inexistente na URL
- **WHEN** a URL traz `fornecedor` sem correspondência entre os fornecedores ativos retornados pela API
- **THEN** o catálogo exibe o estado vazio sem listar produtos de outros fornecedores

#### Scenario: Limpar filtros inclui fornecedor
- **WHEN** o usuário clica em "Limpar filtros"
- **THEN** o filtro de fornecedor também é limpo e removido da URL
