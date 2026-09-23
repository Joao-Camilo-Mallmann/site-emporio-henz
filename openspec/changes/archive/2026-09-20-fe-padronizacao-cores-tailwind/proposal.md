## Why

Atualmente, o frontend (`apps/web`) utiliza cores hexadecimais estáticas e arbitrárias inline (como `[#0C2340]`, `[#123854]`, `[#1D1D24]`, `[#007CD8]`, `[#FEFEFE]`, `[#D2E8F8]`) espalhadas pelas views e componentes (`App.vue`, `HomeView.vue`, etc.).

Isso prejudica a manutenibilidade, dificulta o alinhamento consistente com o design oficial do Figma ([Catálogo digital - Empório Henz](https://www.figma.com/proto/nx4bJnz6Hj3seJHFAC5sHO/Cat%C3%A1logo-digital---Emp%C3%B3rio-Henz?node-id=38-2521)) e impede que agentes de IA e desenvolvedores adotem um vocabulário semântico e consistente de cores e design tokens via Tailwind CSS v4.

Padronizar as cores no Tailwind (`@theme`) e documentar as diretrizes em `docs/` e `apps/web/agents.md` garantirá coerência visual, manutenibilidade e conformidade rigorosa com a identidade visual da Empório Henz.

## What Changes

- **Padronização de Tokens no Tailwind CSS v4**: Configuração de variáveis de tema no `@theme` de `apps/web/src/style.css` mapeando a paleta extraída do Figma:
  - `primary` / `primary-dark`: Azul marinho institucional (`#123854` e `#0C2340`).
  - `secondary` / `secondary-hover`: Azul vivo de destaque (`#007CD8` e `#005CA1`).
  - `dark` / `neutral-dark`: Grafite escuro para tipografia e superfícies contrastantes (`#1D1D24`).
  - `surface-light` / `surface-tint`: Fundo claro (`#FEFEFE`) e tom suave de destaque/hero (`#D2E8F8`).
- **Documentação do Design System**: Criação de `docs/design-system-cores.md` detalhando as cores oficiais do Figma, códigos HEX, classes Tailwind equivalentes e casos de uso recomendados.
- **Atualização das Regras de Agente (`AGENTS.md` e `apps/web/agents.md`)**: Inclusão de regra mandatória para que agentes e desenvolvedores nunca utilizem cores hex arbitrárias inline (`[#...]`), exigindo o uso estrito dos tokens de tema padronizados do Tailwind.
- **Refatoração dos Componentes Existentes**: Substituição das classes hex hardcoded em `apps/web/src/App.vue`, `apps/web/src/views/HomeView.vue` e componentes relacionados pelas novas classes utilitárias semânticas (`bg-primary`, `text-secondary`, `text-dark`, etc.).

## Capabilities

### New Capabilities

- `design-system-tokens`: Definição, configuração no Tailwind CSS v4 e documentação técnica e de agentes dos tokens de cores do projeto baseados no Figma.

### Modified Capabilities

<!-- Nenhuma especificação de regra de negócio funcional ou capacidade existente teve seus requisitos funcionais alterados -->

## Impact

- **Frontend (`apps/web`)**:
  - `apps/web/src/style.css`: Configuração do bloco `@theme`.
  - Componentes e Views (`App.vue`, `HomeView.vue`, `LoginView.vue`, `RegisterView.vue`, `AppNavbar.vue`, `AppFooter.vue`, etc.): Refatoração de classes arbitrárias para classes de tema.
- **Documentação**:
  - Novo arquivo `docs/design-system-cores.md`.
  - Atualização em `apps/web/agents.md` e menção em `AGENTS.md`.
- **Compatibilidade**: Sem breaking changes em APIs ou banco de dados. Mudança puramente visual e arquitetural de frontend (`[FE]` e `[DOCS]`).
