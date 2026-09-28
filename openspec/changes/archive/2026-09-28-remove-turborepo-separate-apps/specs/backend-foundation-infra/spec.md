# Spec Delta

## MODIFIED Requirements

### Requirement: Database Connection Integration
The backend SHALL establish a persistent connection with the PostgreSQL database using the internal database configuration module `backend/src/config/db.ts`, without relying on external shared packages.

#### Scenario: Database ping on startup
- **WHEN** the backend application boots
- **THEN** it SHALL verify database reachability by executing a query through the internal `sql` client without throwing unhandled exceptions
