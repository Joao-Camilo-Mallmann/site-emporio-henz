## Context

O frontend da Empório Henz possui seu layout principal centrado no uso desktop (`AppNavbar.vue`, `HomeView.vue`). A documentação visual do Figma (nó `#38:2521`, captura `image.png` e referência de menu `munu-mobile.png`) especifica uma experiência mobile completa com:
1. Cabeçalho com linha superior compacta e linha de busca integrada.
2. Gaveta de navegação lateral (drawer) azul com acordeão de categorias e links rápidos de usuário.
3. Banner principal vertical para mobile sem os cards de benefícios e com composição fotográfica de poltrona individual com luminária e tapete.
4. Grid de categorias em 2 colunas com espaçamento ajustado.

## Goals / Non-Goals

**Goals:**
- Reutilizar integralmente a lógica e reatividade de `AppNavbar.vue` (`authStore`, `searchQuery`, lista de categorias e subcategorias, controle de sessão) sem duplicação de componentes globais.
- Implementar o cabeçalho mobile fiel ao Figma: Hambúrguer à esquerda, Logo centralizada, Salvos e Perfil à direita, linha de busca full-width integrada abaixo.
- Implementar o Drawer Lateral conforme `munu-mobile.png`:
  - Cabeçalho em `bg-primary` (`#123854`) com logo branca.
  - Corpo em `bg-secondary` (`#007CD8`) com categorias em lista e setas `v` para acordeão de subcategorias.
  - Divisor e links: Salvos, Sobre a loja, Minha conta, Sair / Entrar.
  - Trava de scroll no `body` quando o drawer estiver aberto.
- Segregar o banner da Home em dois componentes especializados:
  - `HeroBannerDesktop.vue`: Composição horizontal com sofá de 3 lugares, 12 colunas e card flutuante de 3 benefícios.
  - `HeroBannerMobile.vue`: Composição vertical compacta com poltrona, luminária, título de 26px e sem o card de benefícios.
- Ajustar o espaçamento do grid de categorias no mobile (`HomeView.vue`) para garantir respiração visual e legibilidade.
- Utilizar estritamente os tokens semânticos do Tailwind v4 (`primary`, `secondary`, `neutral-dark`, `surface-tint`), respeitando a regra de proibição de hexadecimais arbitrários.

**Non-Goals:**
- Não há alterações no backend ou nas migrações de banco de dados (`packages/database`).
- Não inclui modificações nas páginas internas de listagem de produtos ou fluxo de checkout neste ciclo.
- Não altera a lógica de autenticação do Pinia, apenas consome o estado existente no novo drawer.

## Decisions

### Decisão 1: Reutilização do `AppNavbar.vue` via Classes Responsivas
- **Escolha**: Manter um único componente `AppNavbar.vue`, estruturando as seções mobile (`md:hidden`) e desktop (`hidden md:flex`) no mesmo template.
- **Alternativa Considerada**: Criar `AppNavbarMobile.vue` e `AppNavbarDesktop.vue`.
- **Justificativa**: Evita duplicar listeners de eventos (ex: click outside, busca, autenticação Pinia). O controle responsivo do Tailwind é suficiente e mantém o estado de `searchQuery` sincronizado.

### Decisão 2: Segregação dos Banners em `HeroBannerDesktop.vue` e `HeroBannerMobile.vue`
- **Escolha**: Separar fisicamente os dois banners em componentes dedicados em `apps/web/src/components/home/`.
- **Alternativa Considerada**: Usar um único componente com dezenas de classes condicionais `hidden lg:flex`.
- **Justificativa**: O layout do banner mobile difere estruturalmente do desktop: a cena fotográfica é outra (poltrona vs sofá), a hierarquia tipográfica muda e o card de benefícios não existe no mobile. A separação física garante zero risco de regressão no desktop e simplifica a manutenção de código.

### Decisão 3: Estrutura do Drawer Lateral (`munu-mobile.png`)
- **Escolha**: Componente de gaveta em `Teleport to="body"` ou renderizado na raiz do navbar com `fixed inset-0 z-50`.
- **Estrutura**:
  - Backdrop escurecido (`bg-black/50 backdrop-blur-xs`) com fechamento ao clicar.
  - Painel lateral ocupando ~80% da largura (max-w-xs ou max-w-sm).
  - Transições Vue `<Transition>` para entrada suave via `transform -translate-x-full` para `translate-x-0`.
  - Acordeão reativo com `activeAccordion = ref<string | null>(null)`.

```
┌──────────────────────────────────────┐
│ [Logo Empório Henz]            (bg-primary #123854)
├──────────────────────────────────────┤
│ Quarto                             v │ (bg-secondary #007CD8)
│   • Camas                            │
│   • Roupeiros                        │
│ Sala de Estar                      v │
│ Sala de Jantar                     v │
│ Cozinha                            v │
│ Escritório                         v │
│ Banheiro                           v │
├──────────────────────────────────────┤ (Divisor sutil)
│ [♥] Salvos                           │
│ [🏬] Sobre a loja                    │
│ [👤] Minha conta                     │
│ [🚪] Sair                            │
└──────────────────────────────────────┘
```

### Decisão 4: Asset Visual do Banner Mobile
- **Escolha**: Extrair e otimizar o recorte da poltrona com mesa lateral, abajur e tapete para `apps/web/public/images/hero-banner-mobile.png`.
- **Justificativa**: O Figma e o protótipo usam essa cena recortada com fundo transparente e um blob azul marinho em vetor, proporcionando nitidez perfeita em telas de alta densidade (Retina/OLED).

## Risks / Trade-offs

- **[Risco: Scroll da página de fundo enquanto o drawer está aberto]** → *Mitigação*: Ativar `document.body.style.overflow = 'hidden'` ao abrir o menu e restaurar no fechamento ou unmount.
- **[Risco: Acessibilidade de foco e navegação via teclado no drawer]** → *Mitigação*: Incluir `aria-expanded`, botões semânticos e listener de tecla `Escape` para fechar a gaveta.
- **[Risco: Conflito visual de margem negativa do grid de categorias no mobile]** → *Mitigação*: Aplicar `mt-4 sm:mt-6 lg:-mt-24` para que a margem negativa atue somente onde o banner desktop oferece espaço de sobreposição.
