## ADDED Requirements

### Requirement: Backend Containerization
The system SHALL provide a multi-stage Docker build for the Bun backend runtime that compiles the backend and runs the standalone production bundle on port 3001.

#### Scenario: Backend builds and runs successfully
- **WHEN** running `docker compose up backend`
- **THEN** the backend server SHALL start and answer requests at `http://localhost:3001/health` with HTTP 200 OK.

### Requirement: Frontend Containerization with SPA Routing
The system SHALL provide a multi-stage Docker build for the Vue 3 frontend that compiles static assets with Vite and serves them through Nginx with HTML5 history mode routing and `/api/` reverse proxying to the backend.

#### Scenario: Frontend serves SPA and proxies API
- **WHEN** accessing `http://localhost:3000/` in a web browser
- **THEN** the Nginx container SHALL serve the SPA index.html, and requests to `/api/*` SHALL be proxied to the backend service.

### Requirement: Database Containerization
The system SHALL configure a PostgreSQL 16 service in Docker Compose with persistent data volume and healthcheck for local persistence.

#### Scenario: PostgreSQL starts with healthy status
- **WHEN** running `docker compose up postgres`
- **THEN** PostgreSQL SHALL initialize on port 5432 and accept connections using the configured database credentials.

### Requirement: Pull Request Template Integration
The system SHALL provide a GitHub Pull Request template containing sections for description, checklist, OpenSpec change reference, and linking to GitHub Projects.

#### Scenario: PR opened on GitHub
- **WHEN** a contributor opens a Pull Request on GitHub
- **THEN** the PR body SHALL automatically load the template structure with the GitHub Projects reference.
