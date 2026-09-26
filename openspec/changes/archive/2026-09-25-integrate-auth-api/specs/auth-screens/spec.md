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
- **WHEN** the user clicks any test account button on the login screen
- **THEN** the form SHALL populate the corresponding email and password fields with database-seeded credentials (including `admin@gmail.com` / `admin123` for the Admin role) immediately without navigating away

### Requirement: Customer Self-Registration Screen

The application SHALL provide a registration view at `/cadastro` with real-time field validation, phone mask, and seamless submission conforming to backend schema contracts.

#### Scenario: Valid customer registration

- **WHEN** the user fills full name, valid email, Brazilian phone format `(99) 99999-9999`, and matching passwords with at least 8 characters
- **THEN** the application SHALL dispatch `POST /auth/register` sending `fullName`, `email`, `phone`, and `password`, authenticate the session with the returned JWT, and navigate directly to the authenticated storefront

#### Scenario: Form validation prevents submission

- **WHEN** any mandatory field is missing, email format is invalid, or password confirmation does not match
- **THEN** the form SHALL highlight the invalid fields with descriptive inline error messages and block submission
