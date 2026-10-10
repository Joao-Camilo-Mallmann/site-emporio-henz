# Authentication Store and Interceptor

## Purpose

Manage authentication state, tokens, user session lifecycle with Pinia, and HTTP headers with Axios interceptors.

## Requirements

### Requirement: Centralized Pinia Authentication Store

The application SHALL provide a Pinia store `useAuthStore` to manage user identity, authentication status, and session lifecycle reactively against the live Bun backend API using secure cookies.

#### Scenario: User logs in successfully

- **WHEN** the user authenticates with valid credentials in the login view
- **THEN** the component SHALL dispatch `authApi.login` and invoke `authStore.setAuth`, which SHALL persist the session into a cookie named `token` with `SameSite=Lax`, `Path=/`, `Max-Age=1209600`, and `Secure` when on HTTPS, ensure `localStorage` contains no token, normalize and store the user profile (ensuring both `name` and `fullName` are populated), and set `isAuthenticated` to true

#### Scenario: User logs out

- **WHEN** the `logout` action is executed
- **THEN** the application SHALL dispatch `POST /auth/logout`, clear `user` and `token` state, expire the session cookie (`Max-Age=0`), purge any legacy `localStorage` keys, and the navigation menu SHALL immediately revert to the unauthenticated visitor state

#### Scenario: Restore session on reload

- **WHEN** the application boots or the page is reloaded and a valid session cookie is present
- **THEN** the store SHALL dispatch `GET /auth/me` without sending the `Authorization` header to restore the active profile into state with normalized fields and maintain `isAuthenticated` as true

### Requirement: Axios Bearer Token and 401 Interceptors

The application SHALL configure Axios to transmit authentication credentials via cookies without sending the `Authorization` header, and handle session expirations without disrupting visitor navigation on public routes.

#### Scenario: Authenticated HTTP request

- **WHEN** any HTTP request is dispatched through the Axios instance while a session is active
- **THEN** Axios SHALL dispatch the request with cookie credentials enabled and SHALL NOT send the `Authorization` header

#### Scenario: Unauthorized 401 response

- **WHEN** any API endpoint responds with HTTP 401 Unauthorized while accessing a protected route or action
- **THEN** the application SHALL clear session state and redirect the user to `/login`, while unauthenticated responses on public storefront routes SHALL NOT force a redirection to `/login`

#### Scenario: Visitor browses storefront without cookie

- **WHEN** an unauthenticated visitor without a cookie navigates public storefront routes
- **THEN** the application SHALL allow access without redirecting to `/login`, and unauthenticated requests on public pages SHALL NOT force a redirection to `/login`

### Requirement: Backend Healthcheck and Axios Configuration

The application SHALL configure the Axios instance to communicate with the Bun backend API base URL and support system health monitoring.

#### Scenario: Axios instance initialization

- **WHEN** the Axios client is instantiated in `src/plugins/axios.ts`
- **THEN** it SHALL set `baseURL` to `import.meta.env.VITE_API_URL` or fallback to `/api/v1` to ensure Same-Origin requests without CORS failures in production

#### Scenario: Healthcheck request

- **WHEN** `sistemaApi.status()` is called
- **THEN** it SHALL request `GET /health` and return a `BackendStatus` object with `online: true` when the API responds with `{ status: "ok" }`

### Requirement: Client-Side Cookie Validation and Integrity

The application SHALL provide dedicated cookie management and JWT integrity validation utilities to guarantee storage availability and session validity.

#### Scenario: Verify cookie persistence on save

- **WHEN** a token is written to the browser via the cookie utility
- **THEN** the utility SHALL confirm that the cookie value matches in `document.cookie`, throwing or returning a failure status if cookies are blocked or disabled by the browser

#### Scenario: Expired or malformed token rejection

- **WHEN** a cookie token is read but has an invalid structure or an expiration timestamp (`exp`) in the past
- **THEN** the application SHALL reject the token, automatically purge the invalid cookie, and treat the session as unauthenticated without issuing avoidable API calls
