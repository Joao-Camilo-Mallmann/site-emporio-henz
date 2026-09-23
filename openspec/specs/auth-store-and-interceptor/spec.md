# Authentication Store and Interceptor

## Purpose

Manage authentication state, tokens, user session lifecycle with Pinia, and HTTP headers with Axios interceptors.

## Requirements

### Requirement: Centralized Pinia Authentication Store

The application SHALL provide a Pinia store `useAuthStore` to manage user identity, authentication status, and token lifecycle reactively.

#### Scenario: User logs in successfully

- **WHEN** the `login` action is called with valid credentials
- **THEN** the store SHALL persist the token to `localStorage`, update `user` state with the returned profile, and set `isAuthenticated` to true

#### Scenario: User logs out

- **WHEN** the `logout` action is executed
- **THEN** the store SHALL clear `user`, remove the token from `localStorage`, and reset all authentication getters to false

#### Scenario: Restore session on reload

- **WHEN** the application boots and a valid token exists in `localStorage`
- **THEN** the store SHALL invoke `fetchCurrentUser` to load the active profile into state

### Requirement: Axios Bearer Token and 401 Interceptors

The application SHALL configure Axios interceptors to automatically attach the authentication token and handle session expirations.

#### Scenario: Authenticated HTTP request

- **WHEN** any HTTP request is dispatched through the Axios instance while a token is present
- **THEN** Axios SHALL inject the `Authorization: Bearer <token>` header into the request

#### Scenario: Unauthorized 401 response

- **WHEN** any API endpoint responds with HTTP 401 Unauthorized
- **THEN** the Axios response interceptor SHALL trigger `authStore.logout()` and redirect the browser to `/login`
