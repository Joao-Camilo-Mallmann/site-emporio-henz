# Backend Middlewares and RBAC

## Purpose

Fornecer camadas de segurança, autenticação via Bearer token JWT e controle de autorização baseado em perfis (RBAC) para a API.

## Requirements

### Requirement: Bearer Token Authentication Middleware
The backend application SHALL provide an authentication middleware that extracts and validates JWT tokens from the HTTP `Authorization` header.

#### Scenario: Valid Bearer token enriches request context
- **WHEN** a request arrives with a valid `Authorization: Bearer <token>` header
- **THEN** the middleware SHALL decode and verify the token, attach the user identity (`id`, `email`, `role`) to the request context, and allow execution to proceed

#### Scenario: Missing token on protected route
- **WHEN** a request to a protected endpoint lacks an `Authorization` header
- **THEN** the middleware SHALL halt execution and respond with HTTP 401 Unauthorized

#### Scenario: Malformed or expired token
- **WHEN** a request contains an invalid, expired, or tampered JWT token
- **THEN** the middleware SHALL halt execution and respond with HTTP 401 Unauthorized

### Requirement: Role-Based Authorization Guard (RBAC)
The backend application SHALL provide an authorization middleware to restrict access to endpoints based on user roles (`CUSTOMER = 1`, `SELLER = 2`, `ADMIN = 3`).

#### Scenario: User has required role
- **WHEN** an authenticated user whose role matches the allowed roles accesses a protected endpoint
- **THEN** the guard SHALL allow execution to proceed to the controller handler

#### Scenario: Insufficient role permissions
- **WHEN** an authenticated user whose role is not included in the allowed roles accesses a protected endpoint
- **THEN** the guard SHALL halt execution and return HTTP 403 Forbidden with `{ "error": "Forbidden", "message": "Você não possui permissão para executar esta ação." }`

#### Scenario: Admin bypass
- **WHEN** a user with role `ADMIN` (3) accesses any administrative endpoint
- **THEN** the guard SHALL grant access successfully
