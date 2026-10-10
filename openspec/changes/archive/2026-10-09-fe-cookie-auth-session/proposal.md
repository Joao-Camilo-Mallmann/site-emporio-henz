# Proposal

## Why

Armazenar o token de autenticação JWT diretamente no `localStorage` expõe a aplicação a riscos de vazamento de credenciais via ataques XSS e não atende plenamente ao RNF10 definido no projeto. Migrar o armazenamento da sessão para cookies com parâmetros seguros de integridade (`SameSite=Lax`, `Path=/`, `Max-Age=14d`, `Secure` condicional), garantindo que após o login o `localStorage` não retenha qualquer token, que as requisições HTTP não enviem cabeçalho `Authorization` trafegando credenciais nativamente por cookies, que visitantes sem cookie naveguem livremente pela vitrine sem redirecionamento para `/login`, que a sessão seja restaurada no reload via `GET /auth/me` e que o logout execute `POST /auth/logout` revertendo imediatamente o menu ao estado de visitante.

## What Changes

- **Isolamento de sessão em cookies e eliminação de tokens no localStorage**: Após login ou cadastro, o `localStorage` não contém qualquer token de autenticação; a sessão é mantida estritamente via cookies (`src/utils/cookie.ts`) e resíduos legados em `localStorage` são expurgados.
- **Requisições sem cabeçalho Authorization**: As requisições HTTP disparadas pelo cliente não enviam o cabeçalho `Authorization: Bearer <token>`. O transporte e a identificação da sessão ocorrem através do cookie HTTP da requisição (`withCredentials`).
- **Restauração de sessão no reload**: Ao recarregar a página com cookie válido, o frontend invoca `GET /auth/me` (sem envio de cabeçalho `Authorization`) e restaura reativamente o perfil do usuário ativo no Pinia store.
- **Navegação de visitantes sem redirecionamento**: Visitantes sem cookie navegam livremente pela vitrine e páginas públicas sem serem redirecionados para `/login`. Erros 401 ou ausência de sessão em chamadas iniciais não redirecionam visitantes navegando em páginas públicas.
- **Logout formal via API e reversão do menu**: O logout do usuário executa `POST /auth/logout`, expira o cookie de sessão, limpa o estado reativo local e reverte imediatamente o menu de navegação (`AppNavbar`) ao estado de visitante.
- **Suíte de testes automatizados**: Testes cobrindo ausência de tokens no `localStorage`, omissão de `Authorization` nas requisições, navegação de visitantes na vitrine e transição de estado no logout.

## Capabilities

### Modified Capabilities
- `auth-store-and-interceptor`: Modifica o ciclo de autenticação para eliminar o token do `localStorage`, omite o header `Authorization` nas requisições trafegando credenciais via cookies, garante navegação de visitantes na vitrine sem redirecionamento para `/login`, restaura usuário via `GET /auth/me` no reload e integra o logout com `POST /auth/logout` e reversão imediata do menu.

## Impact

- **Código do Frontend**:
  - `frontend/src/utils/cookie.ts`: gerenciamento seguro de cookies e validação de expiração do JWT.
  - `frontend/src/stores/auth.ts`: remoção definitiva de tokens em `localStorage`, chamada a `POST /auth/logout` no logout e restauração via `GET /auth/me`.
  - `frontend/src/plugins/axios.ts`: remoção da injeção de `Authorization: Bearer`, configuração de envio de credenciais de cookie (`withCredentials: true`), e tratamento de 401 sem redirecionar visitantes em rotas públicas.
  - `frontend/src/components/layout/AppNavbar.vue`: garantia de transição reativa imediata para o estado de visitante após o logout.
  - `frontend/src/views/auth/`: tratamento de login e cadastro alinhados ao fluxo de cookies sem persistência em `localStorage`.
- **APIs e Backend**: O backend deve suportar identificação de sessão a partir do cookie da requisição e expor o endpoint `POST /auth/logout`.
- **Dependências**: Zero novas dependências externas adicionadas.
