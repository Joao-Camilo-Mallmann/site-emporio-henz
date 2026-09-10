## 1. Database & Docker Initialization

- [x] 1.1 Create `docker/postgres/init.sql` with complete relational DDL and initial products seed
- [x] 1.2 Create `.dockerignore` at repository root
- [x] 1.3 Create `.env.example` with default database and port variables
- [x] 1.4 Create `apps/backend/Dockerfile` with multi-stage Bun build
- [x] 1.5 Create `apps/web/nginx.conf` with SPA routing and API reverse proxy
- [x] 1.6 Create `apps/web/Dockerfile` with multi-stage Bun build and Nginx runner
- [x] 1.7 Create `docker-compose.yml` orchestrating postgres, backend, and web
- [x] 1.8 Add docker convenience scripts in `package.json`

## 2. Verification & Validation

- [x] 2.1 Run `docker compose up --build -d` to launch all 3 containers
- [x] 2.2 Verify PostgreSQL health and inspect seeded tables and products with `psql`
- [x] 2.3 Validate backend endpoints with `curl http://localhost:3001/health` and `curl http://localhost:3001/api/produtos`
- [x] 2.4 Validate frontend Nginx server and proxy with `curl http://localhost:3000/` and `curl http://localhost:3000/api/health`
