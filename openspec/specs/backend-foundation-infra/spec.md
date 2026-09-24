# Backend Foundation Infrastructure

## Purpose

Prover o servidor HTTP nativo em Bun, roteamento modular versionado, ciclo de vida de conexões PostgreSQL e tratamento uniforme de respostas e erros.

## Requirements

### Requirement: Bun Native HTTP Server and Versioned Routing
The backend application SHALL boot using `Bun.serve` on the configured `PORT` and route incoming HTTP requests matching `/api/v1/*` to modular route controllers.

#### Scenario: Server health check
- **WHEN** an unauthenticated client sends a `GET` request to `/api/v1/health`
- **THEN** the server SHALL respond with HTTP status 200 and a JSON payload containing `status: "ok"`, server uptime, and timestamp

#### Scenario: Preflight CORS request
- **WHEN** a client sends an `OPTIONS` request to any endpoint
- **THEN** the server SHALL respond with HTTP status 204 and standard CORS headers allowing origins and methods

### Requirement: Database Connection Integration
The backend SHALL establish a persistent connection with the PostgreSQL database using the shared client exported by `packages/database/src/db.ts`.

#### Scenario: Database ping on startup
- **WHEN** the backend application boots
- **THEN** it SHALL verify database reachability by executing a query through the shared `sql` client without throwing unhandled exceptions

### Requirement: Standardized Error and Response Format
The application SHALL format all successful and error HTTP responses uniformly with appropriate JSON headers and status codes.

#### Scenario: Unhandled route returns 404
- **WHEN** a client requests an unregistered path
- **THEN** the server SHALL respond with HTTP status 404 and a JSON payload `{ "error": "Not Found", "message": "..." }`

#### Scenario: Uncaught exception returns 500
- **WHEN** an unhandled error occurs during request processing
- **THEN** the server SHALL capture the error and respond with HTTP status 500 and `{ "error": "Internal Server Error", "message": "..." }`
