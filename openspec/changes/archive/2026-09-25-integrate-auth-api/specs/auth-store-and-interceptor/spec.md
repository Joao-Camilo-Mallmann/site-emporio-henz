## MODIFIED Requirements

### Requirement: Centralized Pinia Authentication Store

The application SHALL provide a Pinia store `useAuthStore` to manage user identity, authentication status, and token lifecycle reactively against the live Bun backend API.

#### Scenario: User logs in successfully

- **WHEN** the `login` action is called with valid credentials
- **THEN** the store SHALL dispatch `POST /auth/login` to the live backend, persist the returned JWT token to `localStorage`, normalize and store the user profile (ensuring both `name` and `fullName` are populated), and set `isAuthenticated` to true

#### Scenario: User logs out

- **WHEN** the `logout` action is executed
- **THEN** the store SHALL clear `user`, remove the token from `localStorage`, and reset all authentication getters to false

#### Scenario: Restore session on reload

- **WHEN** the application boots and a valid token exists in `localStorage`
- **THEN** the store SHALL invoke `fetchCurrentUser` dispatching `GET /auth/me` to load the active profile into state with normalized fields

### Requirement: Axios Bearer Token and 401 Interceptors

The application SHALL configure Axios interceptors to automatically attach the authentication token and handle session expirations against the live API.

#### Scenario: Authenticated HTTP request

- **WHEN** any HTTP request is dispatched through the Axios instance while a token is present
- **THEN** Axios SHALL inject the `Authorization: Bearer <token>` header into the request

#### Scenario: Unauthorized 401 response

- **WHEN** any API endpoint responds with HTTP 401 Unauthorized
- **THEN** the Axios response interceptor SHALL trigger `authStore.logout()` and redirect the browser to `/login`

## ADDED Requirements

### Requirement: Backend Healthcheck and Axios Configuration

The application SHALL configure the Axios instance to communicate with the Bun backend API base URL and support system health monitoring.

#### Scenario: Axios instance initialization

- **WHEN** the Axios client is instantiated in `src/plugins/axios.ts`
- **THEN** it SHALL set `baseURL` to `import.meta.env.VITE_API_URL` or fallback to `http://localhost:3001/api/v1`

#### Scenario: Healthcheck request

- **WHEN** `sistemaApi.status()` is called
- **THEN** it SHALL request `GET /health` and return a `BackendStatus` object with `online: true` when the API responds with `{ status: "ok" }`
