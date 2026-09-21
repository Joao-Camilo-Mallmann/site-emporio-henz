# Authentication Screens

## Purpose

Define responsive authentication screens (login, customer self-registration, and internal employee portal) matching the Figma visual design standards.

## Requirements

### Requirement: Public Customer Login Screen
The application SHALL provide a dedicated, responsive login view at `/login` adhering to the Figma visual design standards for customer authentication.

#### Scenario: Client enters valid credentials
- **WHEN** the user inputs valid customer email and password and submits the form
- **THEN** the form SHALL show a loading state, authenticate via `authStore`, and redirect to `/`

#### Scenario: Client enters invalid credentials
- **WHEN** the user submits invalid credentials
- **THEN** the form SHALL display a prominent, clear error banner and keep the user on the login screen

#### Scenario: Password visibility toggle
- **WHEN** the user clicks the eye icon on the password field
- **THEN** the input type SHALL toggle between `password` and `text`

### Requirement: Customer Self-Registration Screen
The application SHALL provide a registration view at `/cadastro` with real-time field validation, phone mask, and seamless submission.

#### Scenario: Valid customer registration
- **WHEN** the user fills full name, valid email, Brazilian phone format `(99) 99999-9999`, and matching passwords with at least 8 characters
- **THEN** the application SHALL register the user, authenticate the session, and navigate directly to the authenticated storefront

#### Scenario: Form validation prevents submission
- **WHEN** any mandatory field is missing, email format is invalid, or password confirmation does not match
- **THEN** the form SHALL highlight the invalid fields with descriptive inline error messages and block submission

### Requirement: Internal Employee Portal Login
The application SHALL provide an internal login view at `/equipe/login` tailored for Salespeople (`role = 2`) and Administrators (`role = 3`).

#### Scenario: Employee authenticates via dedicated portal
- **WHEN** a seller or administrator submits their credentials at `/equipe/login`
- **THEN** the system SHALL authenticate their profile, establish the session, and show their administrative badge in the application layout
