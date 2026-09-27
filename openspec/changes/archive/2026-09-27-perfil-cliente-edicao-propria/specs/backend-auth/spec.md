## ADDED Requirements

### Requirement: Authenticated User Profile Self-Update
The authentication module SHALL provide a `PUT /api/v1/auth/me` endpoint allowing authenticated users (any role: Customer, Seller, Admin) to update their personal profile data (`fullName`, `phone`, `city`) and optionally change their password.

#### Scenario: Successful profile update
- **WHEN** an authenticated user sends a valid PUT request to `/api/v1/auth/me` with `fullName`, `phone`, and `city`
- **THEN** the system SHALL update the corresponding user and client records in PostgreSQL and respond with HTTP 200 containing the updated profile

#### Scenario: Successful password change
- **WHEN** an authenticated user includes a new secure password meeting all 5 security criteria
- **THEN** the system SHALL hash the new password with Argon2id, update `users.password_hash`, and respond with HTTP 200

#### Scenario: Privilege escalation prevention
- **WHEN** an authenticated user includes a `role` field in the request body
- **THEN** the system SHALL ignore or reject the `role` field, ensuring the user's role remains unchanged

#### Scenario: Unauthenticated request rejection
- **WHEN** an unauthenticated request attempts to access `PUT /api/v1/auth/me` without a valid Bearer token
- **THEN** the system SHALL respond with HTTP 401 Unauthorized
