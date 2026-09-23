# Spec Delta

## MODIFIED Requirements

### Requirement: Public Customer Login Screen

The application SHALL provide a single, unified, responsive login view at `/login` adhering to the Figma visual design standards, serving all user roles (Cliente, Vendedor, and Administrador) and redirecting authenticated users to the storefront Home view (`/`).

#### Scenario: Client enters valid credentials
- **WHEN** the user inputs valid email and password for any role (Cliente, Vendedor, or Administrador) and submits the form
- **THEN** the form SHALL show a loading state, authenticate via `authStore`, and redirect to `/` (or to the specified `redirect` query parameter if present)

#### Scenario: Client enters invalid credentials
- **WHEN** the user submits invalid credentials
- **THEN** the form SHALL display a prominent, clear error banner and keep the user on the login screen

#### Scenario: Password visibility toggle
- **WHEN** the user clicks the eye icon on the password field
- **THEN** the input type SHALL toggle between `password` and `text`

#### Scenario: Quick test account selection
- **WHEN** the user clicks any test account button on the login screen (Cliente, Vendedor, or Admin)
- **THEN** the form SHALL populate the corresponding email and password fields immediately without navigating away

## REMOVED Requirements

### Requirement: Internal Employee Portal Login
**Reason**: Replaced by the unified login screen at `/login` for all roles, eliminating redundant screens and aligning with PRD RF01.
**Migration**: All staff and administrator users authenticate via `/login`. The `/equipe/login` route and component are removed completely.
