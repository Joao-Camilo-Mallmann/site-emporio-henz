## 1. Tipos e Utilitários de Mock de Autenticação

- [x] 1.1 Atualizar `src/types/` com contratos de autenticação (`UserProfile`, `LoginCredentials`, `RegisterInput`, `AuthResponse`)
- [x] 1.2 Criar `src/utils/mocks/authMock.ts` com dados simulados (Admin, Vendedor, Cliente), latência assíncrona e persistência em `localStorage`

## 2. Camada de API e Store Pinia

- [x] 2.1 Criar `src/api/auth.ts` estruturando chamadas HTTP com Axios preparadas para o backend Bun e integradas ao mock
- [x] 2.2 Exportar `authApi` em `src/api/index.ts`
- [x] 2.3 Implementar `useAuthStore` em `src/stores/auth.ts` com estado reativo, getters de papel (`isAdmin`, `isVendedor`, `isCliente`) e actions (`login`, `register`, `fetchCurrentUser`, `logout`)
- [x] 2.4 Atualizar `src/plugins/axios.ts` com interceptor de requisição para `Authorization: Bearer <token>` e interceptor de resposta para captura de `401` com logout e redirecionamento

## 3. Telas de Autenticação Fidedignas ao Figma

- [x] 3.1 Implementar `LoginView.vue` em `src/views/auth/LoginView.vue` com validação de campos, alternância de visibilidade de senha, estado de carregamento e atalhos rápidos de teste
- [x] 3.2 Implementar `RegisterView.vue` em `src/views/auth/RegisterView.vue` com máscara dinâmica de WhatsApp `(99) 99999-9999`, validações de senha mínima de 8 caracteres e confirmação
- [x] 3.3 Implementar `EquipeLoginView.vue` em `src/views/auth/EquipeLoginView.vue` para portal restrito de Vendedores e Administradores
- [x] 3.4 Configurar as rotas `/login`, `/cadastro` e `/equipe/login` em `src/router/index.ts` com títulos e meta de navegação

## 4. Layout Base e Tela Principal (Home / Main)

- [x] 4.1 Implementar `AppNavbar.vue` em `src/components/layout/AppNavbar.vue` com paleta azul-marinho (`#0C2340`), top-bar de atendimento, logotipo da marca, campo de busca, links de navegação e menu do usuário autenticado
- [x] 4.2 Implementar `AppFooter.vue` em `src/components/layout/AppFooter.vue` com dados institucionais da loja física em Cruzeiro do Sul - RS, horários, redes sociais e atalho sutil para portal da equipe
- [x] 4.3 Atualizar `App.vue` para utilizar `AppNavbar` e `AppFooter`
- [x] 4.4 Reformular `HomeView.vue` em `src/views/HomeView.vue` com Hero banner de móveis em madeira maciça (tradição familiar de 50 anos), vitrine de ambientes e produtos destacados com selos de pronta entrega / sob encomenda e parcelamento

## 5. Verificação e Validação de Tipos

- [x] 5.1 Executar `bun run check-types` para garantir 100% de conformidade com TypeScript
- [x] 5.2 Executar `bun run lint` para validar formatação e padrões de código
- [x] 5.3 Testar build de produção com `bun run build`
