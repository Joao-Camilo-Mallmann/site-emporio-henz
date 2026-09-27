## 1. Configuração do Cliente Axios e Serviços de API ([FE])

- [x] 1.1 Configurar `baseURL` no cliente Axios (`apps/web/src/plugins/axios.ts`) utilizando `import.meta.env.VITE_API_URL` com fallback para `http://localhost:3001/api/v1`
- [x] 1.2 Desativar mock e alinhar rotas em `apps/web/src/api/auth.ts` para `/auth/login`, `/auth/register` e `/auth/me`, adicionando normalização dos campos `name` e `fullName`
- [x] 1.3 Mapear resposta do endpoint `/health` em `apps/web/src/api/sistema.ts` para retornar objeto compatível com `BackendStatus` (`online: true` quando `status === "ok"`)

## 2. Tipagem e Telas de Autenticação ([FE])

- [x] 2.1 Adequar as interfaces em `apps/web/src/types/auth.ts` para suportar `fullName` e garantir retrocompatibilidade com `name`
- [x] 2.2 Atualizar submissão em `apps/web/src/views/auth/RegisterView.vue` para enviar `fullName` conforme validação em `auth.schema.ts`
- [x] 2.3 Atualizar atalhos de contas de teste em `apps/web/src/views/auth/LoginView.vue` para usar as credenciais do seed padrão (`admin@gmail.com` / `admin123`)

## 3. Validação e Qualidade de Código ([TEST])

- [x] 3.1 Executar checagem de tipos (`bun run check-types`) e linter (`bun run lint`) no pacote `apps/web`
- [x] 3.2 Verificar aderência com os contratos e status da collection Bruno (`docs/backend/collections/bruno/Auth/`)
