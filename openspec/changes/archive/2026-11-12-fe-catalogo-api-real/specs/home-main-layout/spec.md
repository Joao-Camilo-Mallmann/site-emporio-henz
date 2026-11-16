## ADDED Requirements

### Requirement: Home Product Showcases Driven by the Products API
The Home "Destaques" and "Recomendados" showcases SHALL be filled with products returned by `GET /produtos` (first page, 8 items: items 1–4 in Destaques, 5–8 in Recomendados), rendered with the catalog product card, and SHALL NOT use hardcoded product data.

#### Scenario: Products available
- **WHEN** a visitor opens `/` and the API returns active products
- **THEN** the Destaques showcase SHALL show the first 4 products and the Recomendados showcase SHALL show the next 4, each with its real photo, price and availability

#### Scenario: Products loading
- **WHEN** the products request is pending
- **THEN** each showcase SHALL show skeleton cards instead of product data

#### Scenario: Request failed or no products
- **WHEN** the products request fails or returns no items
- **THEN** the empty showcases SHALL be hidden and the rest of the Home SHALL render normally
