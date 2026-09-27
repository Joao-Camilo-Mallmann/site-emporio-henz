# Client Profile Screen

## Purpose

Permitir que usuários autenticados (Clientes e Vendedores) acessem uma tela dedicada de edição do próprio perfil (`/perfil`), atualizem seus dados pessoais e redefinam sua senha sem acessar o painel administrativo.

## Requirements

### Requirement: Customer and Seller Profile View
The web application SHALL provide a `/perfil` route rendered by `PerfilView.vue` for authenticated users to view and edit their profile.

#### Scenario: Navigating to profile view
- **WHEN** an authenticated Customer or Seller accesses the `/perfil` route
- **THEN** the system SHALL load the current user profile from `GET /api/v1/auth/me` and render the profile edit form

#### Scenario: Form rendering with role hidden
- **WHEN** the profile form is rendered in the `/perfil` view
- **THEN** the system SHALL display fields for Full Name, Phone, City, and Password Reset, while keeping the Email field disabled and omitting the Access Role select input

#### Scenario: Successful profile save
- **WHEN** the user submits valid changes on the `/perfil` form
- **THEN** the system SHALL send `PUT /api/v1/auth/me`, display a success toast notification, and update the reactive session user state

#### Scenario: Unauthenticated visitor redirection
- **WHEN** an unauthenticated visitor attempts to access `/perfil`
- **THEN** the router guard SHALL redirect the visitor to `/login?redirect=/perfil`

### Requirement: User Menu Role-Aware Navigation
The navigation header SHALL dynamically direct users to the appropriate profile editing interface based on their role.

#### Scenario: Admin clicks edit user
- **WHEN** an authenticated user with role Administrator clicks the user menu edit action
- **THEN** the application SHALL navigate to `/admin/usuarios/:id/editar`

#### Scenario: Customer or Seller clicks edit profile
- **WHEN** an authenticated user with role Customer or Seller clicks the user menu edit action
- **THEN** the application SHALL navigate to `/perfil`
