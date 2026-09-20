# Home and Main Layout

## Purpose

Provide application shell layout (Navbar and Footer) and the high-end storefront landing page showcasing Empório Henz's 50-year heritage and furniture environments.

## Requirements

### Requirement: Responsive Base Layout with Figma Identity
The application SHALL render a consistent, responsive layout comprising `AppNavbar` and `AppFooter` themed with Empório Henz's deep navy palette (`#0C2340`) and warm accents.

#### Scenario: Unauthenticated visitor views navigation header
- **WHEN** an unauthenticated visitor accesses any page
- **THEN** `AppNavbar` SHALL display the store logo, top contacts bar, search bar, navigation links, and action buttons "Entrar" e "Cadastrar"

#### Scenario: Authenticated user views navigation header
- **WHEN** an authenticated user visits any page
- **THEN** `AppNavbar` SHALL display the user's name/avatar with a dropdown menu offering "Minhas Listas", "Meu Perfil", role-specific links ("Painel Administrativo" for Admin/Vendedor), and a "Sair" button

#### Scenario: Complete institutional footer
- **WHEN** a user scrolls to the bottom of the page
- **THEN** `AppFooter` SHALL display the store address in Cruzeiro do Sul - RS, business hours, social links, and a subtle portal link for internal team access

### Requirement: High-End Home Showcase Page
The application SHALL provide a rich `HomeView` at `/` showcasing hero banner, environments, and highlighted furniture collections.

#### Scenario: Visitor views home page
- **WHEN** a user navigates to `/`
- **THEN** the page SHALL present the 50-year heritage hero banner, environment cards (Living, Dining, Bedroom, Gourmet), and featured product cards with availability tags (Pronta Entrega / Sob Encomenda)
