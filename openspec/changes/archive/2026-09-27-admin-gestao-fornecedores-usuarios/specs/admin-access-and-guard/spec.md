## MODIFIED Requirements

### Requirement: Protected Administrative Route

The application SHALL provide an internal administrative dashboard at `/admin` and administrative management sub-routes (`/admin/fornecedores`, `/admin/fornecedores/novo`, `/admin/fornecedores/:id/editar`, `/admin/usuarios`, `/admin/usuarios/novo`, `/admin/usuarios/:id/editar`) accessible strictly by authenticated users with valid Bearer token and authorized roles. Specifically, the dashboard `/admin` is accessible by Vendedor (`role = 2`) and Administrador (`role = 3`), while all supplier and user management routes (`/admin/fornecedores*` and `/admin/usuarios*`) are restricted exclusively to Administrador (`role = 3`).

#### Scenario: Staff member accesses /admin
- **WHEN** an authenticated user with role Vendedor or Administrador navigates to `/admin`
- **THEN** the application SHALL allow access and render the administrative dashboard view

#### Scenario: Administrator accesses administrative management routes
- **WHEN** an authenticated user with role Administrador navigates to any `/admin/fornecedores*` or `/admin/usuarios*` route
- **THEN** the application SHALL allow access and render the corresponding list or form view

#### Scenario: Unauthenticated visitor attempts to access /admin or sub-routes
- **WHEN** an unauthenticated visitor (without a valid token) navigates to `/admin` or any of its sub-routes
- **THEN** the router SHALL redirect the visitor to `/login` preserving the target path in `redirect` query parameter

#### Scenario: Customer attempts to access /admin or sub-routes
- **WHEN** an authenticated customer (`role = 1`) navigates to `/admin` or any administrative sub-route
- **THEN** the router SHALL block access, redirect the customer to the storefront Home view (`/`), and display an unauthorized access alert

#### Scenario: Salesperson attempts to access exclusive admin sub-routes
- **WHEN** an authenticated salesperson (`role = 2`) navigates to `/admin/fornecedores*` or `/admin/usuarios*`
- **THEN** the router SHALL block access, redirect to `/admin`, and display an unauthorized access alert

## ADDED Requirements

### Requirement: Simplified Admin Dashboard with Prominent Action Cards
The application SHALL render the administrative dashboard (`AdminDashboardView`) in a simplified layout featuring two prominent action cards/buttons directing to Suppliers Management and Users Management.

#### Scenario: Administrator views dashboard
- **WHEN** an administrator accesses `/admin`
- **THEN** the dashboard SHALL display two large primary action cards: "Gestão de Fornecedores" (linking to `/admin/fornecedores`) and "Gestão de Usuários & Clientes" (linking to `/admin/usuarios`), omitting placeholder stats and inactive modules
