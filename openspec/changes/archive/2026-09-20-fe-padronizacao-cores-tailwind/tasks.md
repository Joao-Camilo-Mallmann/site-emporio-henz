## 1. Configuração dos Tokens de Tema no Tailwind CSS v4 ([FE])

- [x] 1.1 Configurar a diretiva `@theme` em `apps/web/src/style.css` com os tokens de cores extraídos do Figma (`--color-primary`, `--color-primary-dark`, `--color-secondary`, `--color-secondary-hover`, `--color-neutral-dark`, `--color-surface-light`, `--color-surface-tint`, `--color-wood-*`).
- [x] 1.2 Validar a compilação do Vite com `bun run build` para garantir que os tokens de tema gerados pelo Tailwind v4 funcionam corretamente.

## 2. Refatoração dos Componentes e Views Existentes ([FE])

- [x] 2.1 Refatorar `apps/web/src/App.vue` substituindo classes com valores hex arbitrários (como `bg-[#FEFEFE]`) pelos tokens semânticos (`bg-surface-light`).
- [x] 2.2 Refatorar `apps/web/src/views/HomeView.vue` substituindo `bg-[#D2E8F8]` por `bg-surface-tint`, `bg-[#123854]` e `text-[#123854]` por `bg-primary` e `text-primary`, `text-[#007CD8]` por `text-secondary`, `text-[#1D1D24]` e `bg-[#1D1D24]/80` por `text-neutral-dark` e `bg-neutral-dark/80`.
- [x] 2.3 Inspecionar e refatorar `AppNavbar.vue`, `AppFooter.vue`, `LoginView.vue` e `RegisterView.vue` para garantir que quaisquer cores hexadecimais inline sejam substituídas pelas classes utilitárias de tema.

## 3. Documentação do Design System e Regras para Agentes ([DOCS])

- [x] 3.1 Criar `docs/design-system-cores.md` com o mapeamento completo do design system do Figma (tokens, códigos hexadecimais, classes Tailwind geradas, papéis de uso e link para o arquivo do Figma).
- [x] 3.2 Atualizar `apps/web/agents.md` com as diretrizes estritas de padronização de cores, proibindo o uso de classes arbitrárias inline `[#...]` e instruindo o uso dos tokens de tema.
- [x] 3.3 Atualizar `AGENTS.md` na raiz para adicionar o padrão de cores do design system nas diretrizes globais do projeto.

## 4. Validação e Qualidade ([FE])

- [x] 4.1 Executar a checagem de tipos estrita (`bun run check-types`) no workspace.
- [x] 4.2 Executar o linter (`bun run lint`) e o build de produção (`bun run build`) para assegurar integridade total da aplicação.
- [x] 4.3 Use um subagent spar avalida o codigo rapidnho pro cima buscar outra falhas, pode ser de um mopdel mais fraco para conomioa tokens
