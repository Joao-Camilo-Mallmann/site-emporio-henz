# Spec Delta

## Purpose

Define access control, navigation protection, and header integration for the internal administrative panel at `/admin` restricted to Salespeople and Administrators.

## ADDED Requirements

### Requirement: Protected Administrative Route

The application SHALL provide an internal administrative dashboard at `/admin` accessible strictly by authenticated users with role Vendedor (`role = 2`) or Administrador (`role = 3`).

#### Scenario: Staff member accesses /admin
- **WHEN** an authenticated user with role Vendedor or Administrador navigates to `/admin`
- **THEN** the application SHALL allow access and render the administrative dashboard view

#### Scenario: Unauthenticated visitor attempts to access /admin
- **WHEN** an unauthenticated visitor navigates to `/admin`
- **THEN** the router SHALL redirect the visitor to `/login?redirect=/admin`

#### Scenario: Customer attempts to access /admin
- **WHEN** an authenticated customer (`role = 1`) navigates to `/admin`
- **THEN** the router SHALL block access, redirect the customer to the storefront Home view (`/`), and display an unauthorized access alert

### Requirement: Header Admin Panel Navigation Button

The application SHALL display an administrative action button adjacent to the "Minha conta" user menu in the desktop header and in the mobile drawer when an authenticated user has staff or administrator privileges.

#### Scenario: Staff member views header
- **WHEN** a user with role Vendedor or Administrador is authenticated
- **THEN** the header SHALL display a highlighted button labeled "Painel Admin" (linking to `/admin`) directly beside the "Minha conta" menu

#### Scenario: Non-staff user views header
- **WHEN** a visitor is unauthenticated or logged in as a Customer (`role = 1`)
- **THEN** the header SHALL NOT display the administrative panel button
