# Tasks

## 1. Persistência de Sessão e Limpeza de Storage

- [ ] 1.1 Garantir que após login e cadastro o token não seja armazenado no `localStorage` e qualquer resíduo legado seja expurgado, persistindo a sessão exclusivamente via cookie
- [ ] 1.2 Atualizar testes unitários (`frontend/src/utils/cookie.test.ts` e `frontend/src/stores/auth.test.ts`) comprovando que `localStorage` permanece sem token após login

## 2. Configuração do Axios e Omissão do Header Authorization

- [ ] 2.1 Modificar `frontend/src/plugins/axios.ts` para habilitar `withCredentials: true` e remover a injeção do cabeçalho `Authorization: Bearer` em todas as requisições
- [ ] 2.2 Atualizar testes do cliente Axios (`frontend/src/plugins/axios.test.ts`) comprovando que requisições não enviam `Authorization`

## 3. Restauração de Sessão no Reload

- [ ] 3.1 Ajustar inicialização do `useAuthStore` e guardas de rota para executar `GET /auth/me` no reload da página quando houver cookie válido, restaurando o perfil do usuário no Pinia
- [ ] 3.2 Validar em testes unitários/integração que o reload com cookie válido restaura o usuário via `GET /auth/me` sem intervenção manual

## 4. Navegação Livre para Visitantes na Vitrine

- [ ] 4.1 Ajustar o interceptor de resposta do Axios e router guards para que erros 401 e ausência de cookie não redirecionem visitantes navegando na vitrine (rotas públicas) para `/login`
- [ ] 4.2 Testar a navegação de visitante sem cookie garantindo permanência nas páginas públicas da vitrine sem redirecionamento forçado

## 5. Logout com Chamada à API e Reatividade do Menu

- [ ] 5.1 Atualizar `authApi` e `useAuthStore.logout` para disparar `POST /auth/logout`, expirar cookies e resetar o estado de autenticação
- [ ] 5.2 Garantir que o componente `AppNavbar` (desktop e mobile drawer) reaja imediatamente ao logout retornando ao estado de visitante com os links corretos
- [ ] 5.3 Executar bateria completa de testes e validação estática de tipos (`bun test` e checagem de tipos) para certificar a conformidade dos 5 pontos
