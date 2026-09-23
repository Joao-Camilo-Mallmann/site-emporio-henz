## Context

O frontend da Empório Henz (`apps/web`) utiliza Vue 3 (Composition API com `<script setup lang="ts">`), Vite 6, Tailwind CSS v4, Vue Router 4 e Pinia. O layout geral do sistema foi concebido no Figma com foco no público de móveis nobres e alta decoração (Cruzeiro do Sul - RS).

Enquanto a persistência em PostgreSQL e as rotas nativas no Bun (`apps/backend`) serão integradas na sequência, o desenvolvimento atual estabelece a infraestrutura completa de autenticação no frontend (Store Pinia, Interceptors Axios, Telas de Login/Registro e Home/Navbar/Footer do Figma) com uma arquitetura de serviços desacoplada pronta para chavear entre dados simulados (mock) e chamadas HTTP reais.

## Goals / Non-Goals

**Goals:**

- Centralizar o estado da sessão de usuário em `useAuthStore` (Pinia) com persistência em `localStorage` e getters semânticos de permissão (`isAdmin`, `isVendedor`, `isCliente`, `isAuthenticated`).
- Configurar interceptores no Axios (`src/plugins/axios.ts`) para injeção automática de `Bearer <token>` e captura global de `401 Unauthorized`.
- Estruturar os métodos de API em `src/api/auth.ts` (`login`, `register`, `me`) delegando temporariamente para o utilitário `src/utils/mocks/authMock.ts`.
- Construir as telas de `LoginView.vue` (`/login`), `RegisterView.vue` (`/cadastro`) e `EquipeLoginView.vue` (`/equipe/login`) fiéis ao protótipo do Figma.
- Atualizar a identidade visual global com `AppNavbar.vue`, `AppFooter.vue` e `HomeView.vue` incorporando a paleta azul-marinho (`#0C2340`) e acabamentos amadeirados.

**Non-Goals:**

- Implementar as rotas de backend Bun em `apps/backend/src/index.ts` ou migrações SQL de banco de dados (escopo das histórias `[US-DB-01]` e `[US-BE-01 a 03]`).
- Construir as telas administrativas de gestão de produtos, fornecedores ou categorias neste incremento.

## Decisions

### 1. Desacoplamento entre Serviços de API e Utilitários de Mock

- **Decisão**: A camada `src/api/auth.ts` define a assinatura e o contrato HTTP exato que o backend Bun consumirá. Internamente, consome funções de `src/utils/mocks/authMock.ts` que simulam latência (350ms) e persistência.
- **Alternativas consideradas**:
  - _Mock embutido no interceptor do Axios_: Mais opaco e difícil de depurar.
  - _Mock direto na Store_: Acopla a regra de negócio da store com detalhes de rede, exigindo refatoração futura.
- **Justificativa**: Atende diretamente à diretriz definida no alinhamento: o desenvolvedor backend tem clareza imediata dos payloads esperados e basta descomentar as linhas do Axios para ativar o ambiente real.

### 2. Rotas Dedicadas para Autenticação (`/login`, `/cadastro`, `/equipe/login`)

- **Decisão**: Criar rotas completas no Vue Router em vez de caixas de diálogo modais.
- **Alternativas consideradas**:
  - _Modal flutuante de login sobre a Home_: Prejudica o compartilhamento de links diretos e complica a validação de formulários extensos.
- **Justificativa**: Oferece foco total do usuário no preenchimento, suporte nativo ao histórico do navegador e alinhamento visual com os frames dedicados do Figma.

### 3. Portal Oculto para Colaboradores (`/equipe/login`)

- **Decisão**: Disponibilizar uma rota específica para Vendedores e Administradores, mantendo a tela `/login` voltada exclusivamente para o cliente/consumidor.
- **Alternativas consideradas**:
  - _Login único compartilhado com seletor de perfil_: Expõe os papéis internos da empresa para o cliente final.
- **Justificativa**: Requisito acordado durante a entrevista para resguardar a privacidade institucional e permitir customizações específicas de acesso corporativo.

### 4. Paleta de Cores e Estilos Tailwind CSS v4

- **Decisão**: Padronizar as classes utilitárias no Tailwind v4 com a paleta extraída do protótipo:
  - Fundo institucional e barras: `#0C2340` (`bg-slate-900` / `#0C2340`)
  - Acentos e selos de madeira: `#92400E` (`amber-800`), `#78350F` (`amber-900`)
  - Dourado clássico: `#D4AF37`
  - Superfícies neutras: `#F8FAFC` (`slate-50`), `#FFFFFF`

## Risks / Trade-offs

- **[Risco] Divergência de contratos quando o backend Bun for implementado**:
  - _Mitigação_: Os tipos de dados em `src/types/` (`UserProfile`, `LoginCredentials`, `RegisterInput`) espelham fielmente os esquemas das tabelas `users` e `clients` de `packages/database/migrations/001_initial_schema.sql`.
- **[Risco] Sessões mockadas em localStorage não expirarem sozinhas**:
  - _Mitigação_: O utilitário `authMock.ts` gera timestamps de expiração simulados e validação no `fetchCurrentUser`.
