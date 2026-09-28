# Spec Delta

## MODIFIED Requirements

### Requirement: Backend Healthcheck and Axios Configuration

The application SHALL configure the Axios instance to communicate with the Bun backend API base URL and support system health monitoring.

#### Scenario: Axios instance initialization

- **WHEN** the Axios client is instantiated in `src/plugins/axios.ts`
- **THEN** it SHALL set `baseURL` to `import.meta.env.VITE_API_URL` or fallback to `/api/v1` to ensure Same-Origin requests without CORS failures in production

#### Scenario: Healthcheck request

- **WHEN** `sistemaApi.status()` is called
- **THEN** it SHALL request `GET /health` and return a `BackendStatus` object with `online: true` when the API responds with `{ status: "ok" }`
