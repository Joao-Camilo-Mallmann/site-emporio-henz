# Design

## Context

Atualmente o front-end manipulava o JWT retornado pela autenticação no `localStorage`, e o Axios injetava o cabeçalho `Authorization: Bearer <token>`. Além disso, respostas 401 causavam redirecionamento forçado para `/login`, o que prejudicava visitantes que navegavam em páginas públicas caso alguma chamada não autenticada falhasse, e o logout ocorria apenas localmente sem acionar um encerramento formal na API.

Para elevar a postura de segurança e atender integralmente à experiência do usuário e aos requisitos de arquitetura da sessão, a persistência passa a residir exclusivamente em cookies seguros, eliminando o cabeçalho `Authorization` das requisições HTTP, garantindo navegação desimpedida da vitrine para visitantes sem cookies, restaurando a sessão no reload via `GET /auth/me` e invocando `POST /auth/logout` com reversão reativa do menu.

## Goals / Non-Goals

**Goals:**
- Garantir que após o login o `localStorage` não retenha qualquer token de autenticação, residindo a sessão exclusivamente em cookies seguros.
- Configurar o Axios para não enviar o cabeçalho `Authorization: Bearer <token>` em nenhuma requisição, trafegando as credenciais de sessão por cookies HTTP (`withCredentials: true`).
- Restaurar a sessão e perfil do usuário ativo ao recarregar a página com cookie válido via `GET /api/v1/auth/me`.
- Garantir que visitantes sem cookie naveguem livremente pela vitrine e páginas públicas sem redirecionamento para `/login`.
- Implementar o logout com chamada formal a `POST /api/v1/auth/logout`, expiração do cookie, limpeza do estado local e atualização reativa do menu de navegação (`AppNavbar`) para o estado de visitante.

**Non-Goals:**
- Não remover proteção de rotas restritas (rotas com `requiresAuth` no router continuarão bloqueadas para visitantes e redirecionarão para login).
- Não persistir cópias de backup do JWT em outros storages de navegador como `sessionStorage` ou `IndexedDB`.

## Decisions

### Decisão 1: Persistência Exclusiva em Cookies e Expurgamento do `localStorage`
- **Escolha**: Gravar a sessão exclusivamente no cookie (`name: "token"`, `SameSite=Lax`, `Path=/`, `Max-Age=1209600`, `Secure` condicional) e limpar explicitamente qualquer chave legada em `localStorage` durante login, registro e inicialização do store.
- **Alternativas consideradas**: Manter cópia no `localStorage` por redundância.
- **Justificativa**: Evita a exposição do token ao vetor XSS no `localStorage` e garante coerência estrita de que o storage local não contém tokens.

### Decisão 2: Requisições HTTP sem Cabeçalho Authorization e Transporte via Cookies
- **Escolha**: O cliente Axios é configurado para enviar requisições com transporte de credenciais por cookie (`withCredentials: true`), removendo o interceptor que injetava `Authorization: Bearer <token>`.
- **Alternativas consideradas**: Injetar `Authorization` a partir da leitura do cookie em cada requisição.
- **Justificativa**: Atende diretamente à diretriz de arquitetura onde requisições não enviam `Authorization`, delegando o transporte da credencial aos cookies do protocolo HTTP.

### Decisão 3: Restauração de Sessão no Boot/Reload via `GET /auth/me`
- **Escolha**: Ao carregar a aplicação, se houver cookie válido detectado, o `useAuthStore.fetchCurrentUser()` dispara `GET /api/v1/auth/me` (sem header Authorization). Ao obter sucesso, popula os dados do usuário e marca `isAuthenticated = true`.
- **Alternativas consideradas**: Carregar dados do usuário persistidos no localStorage.
- **Justificativa**: Mantém o servidor como autoridade sobre a validade da sessão e garante dados frescos do perfil ao recarregar.

### Decisão 4: Navegação Desimpedida de Visitantes e Tratamento Condicional de 401
- **Escolha**: O interceptor de resposta do Axios não realiza redirecionamento global incondicional com `window.location.href = "/login"` ao receber 401. Apenas rotas explicitamente protegidas (gerenciadas pelo `router.beforeEach`) ou ações que requerem autenticação provocam redirecionamento para o login. Visitantes sem cookie navegando pela vitrine pública (home, sobre a loja, listagem de produtos) não sofrem redirecionamento.
- **Alternativas consideradas**: Redirecionar incondicionalmente em qualquer 401.
- **Justificativa**: Previne expulsão indesejada de visitantes que estão apenas explorando a vitrine da loja sem interesse imediato em efetuar login.

### Decisão 5: Ciclo de Logout com `POST /auth/logout` e Reversão Reativa do Menu
- **Escolha**: A função `logout()` dispara `POST /api/v1/auth/logout` via `authApi.logout()`, remove o cookie local via `removeCookie("token")`, zera `user.value = null` e `token.value = null`. O componente de navegação (`AppNavbar`), por ser reativo ao `authStore.isAuthenticated`, renderiza imediatamente os links de visitante ("Minha conta" / "Entrar"). Mesmo que a requisição de logout à API retorne erro ou falhe na rede, o estado local é limpo garantindo que o usuário saia no cliente.
- **Alternativas consideradas**: Limpar apenas os cookies locais sem notificar o backend.
- **Justificativa**: Assegura invalidação formal da sessão pelo backend e garante transição visual instantânea da UI.

## Risks / Trade-offs

- **[Risco: Falha de rede ou timeout na requisição `POST /auth/logout`]**  
  → *Mitigação*: O bloco `try/finally` ou tratamento de erro garante que a limpeza do cookie local e o reset do Pinia ocorram incondicionalmente, garantindo que o usuário não fique preso logado no frontend.
- **[Risco: Erro 401 no `GET /auth/me` durante boot para visitante anônimo ou sessão expirada]**  
  → *Mitigação*: A falha em `fetchCurrentUser` apenas define o estado como deslogado (`user = null`) sem disparar erro fatal nem redirecionar para `/login` quando o usuário estiver em rotas públicas.
- **[Risco: Navegadores com cookies totalmente bloqueados]**  
  → *Mitigação*: `setCookie` verifica a persistência imediata e o formulário de login exibe aviso amigável ao usuário caso os cookies estejam desativados.

## Migration Plan

1. Ajustar `frontend/src/plugins/axios.ts` para habilitar `withCredentials: true`, remover injeção de `Authorization` e remover redirecionamento incondicional para `/login` no erro 401.
2. Atualizar `frontend/src/stores/auth.ts` e `frontend/src/api/auth.ts`:
   - Adicionar método `logout` chamando `POST /auth/logout`.
   - Garantir que `localStorage` permaneça vazio de tokens após login.
   - Ajustar `fetchCurrentUser` para restaurar perfil no boot via `GET /auth/me`.
3. Ajustar `AppNavbar.vue` para garantir reversão ao estado de visitante ao concluir logout.
4. Ajustar router navigation guard para proteger apenas rotas `requiresAuth`.
5. Atualizar e rodar suíte de testes unitários para validar todos os 5 cenários.
