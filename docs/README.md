# Documentação do Projeto — Empório Henz

Bem-vindo à documentação oficial do **Portal Empório Henz**. A pasta `docs/` está organizada por domínios técnicos e especificações gerais de produto e negócio.

---

## 🗺️ Mapa da Documentação

```
docs/
├── README.md                       # Índice central e guia de navegação
├── PRD.md                          # Documento de Requisitos do Produto (SSOT de Produto)
├── user-stories-backlog.md         # Backlog mestre de histórias e critérios de aceitação
├── padrao-historias-tarefas.md     # Guia e template oficial de decomposição de tarefas
├── perguntas-cliente.md            # Entrevista e levantamento de requisitos de negócio
│
├── database/                       # Camada de Banco de Dados [DB]
│   ├── README.md                   # Diretrizes, entidades e execução de migrações
│   ├── diagram.png                 # Diagrama Entidade-Relacionamento (DER em PNG)
│   ├── der_emporio_henz.pdf        # DER formal em formato PDF
│   └── render_diagram.html         # Editor/renderizador interativo Mermaid.js
│
├── backend/                        # Camada de Servidor e API [BE]
│   ├── README.md                   # Arquitetura Bun.serve, padrões REST e RBAC
│   └── diagrama_classes_emporio_henz.pdf # Diagrama de classes UML formal
│
├── frontend/                       # Camada de Interface e Cliente Web [FE]
│   ├── README.md                   # Arquitetura Vue 3, Pinia e diretrizes de UI/UX
│   └── design-system-cores.md      # Catálogo oficial de cores Figma & Tailwind v4
│
├── infra/                          # Camada de Infraestrutura e DevOps [INFRA]
│   ├── README.md                   # Arquitetura Docker Compose, Nginx e deploy
│   └── backup-restore-guide.md     # Guia operacional de backup e restauração PostgreSQL
│
└── old/                            # Arquivos de referência legados
    └── PDR-exemplo.md              # Exemplo inicial de PRD de referência
```

---

## 📚 Categorias Detalhadas

### 1. 📖 Requisitos Gerais, Negócio e Governança (Raiz)

- **[PRD.md](./PRD.md)**: Visão completa do produto, regras de negócio, personas, jornada do usuário e requisitos funcionais/não-funcionais.
- **[user-stories-backlog.md](./user-stories-backlog.md)**: Todas as histórias de usuário decompostas por fases (`Fase 1` - Parcial 1 e `Fase 2` - Parcial 2 / Final) e por camadas técnicas (`[DB]`, `[BE]`, `[FE]`, `[INFRA]`, `[TEST]`).
- **[padrao-historias-tarefas.md](./padrao-historias-tarefas.md)**: Manual normativo com o fluxo de trabalho Database First, convenção de títulos e template oficial para criação de issues no GitHub.
- **[perguntas-cliente.md](./perguntas-cliente.md)**: Respostas e alinhamentos reais obtidos durante a entrevista inicial com a liderança da Empório Henz.

### 2. 🗄️ [database/](./database) — Persistência e Banco de Dados

- Modelagem conceitual, lógica e física em PostgreSQL 16.
- [Diagrama Entidade-Relacionamento (DER)](./database/diagram.png) e sua versão em [PDF](./database/der_emporio_henz.pdf).
- Gerenciamento de migrações SQL idempotentes em `packages/database`.

### 3. 💻 [backend/](./backend) — API e Regras de Servidor

- Servidor em tempo de execução com Bun nativo (`Bun.serve`).
- [Diagrama de Classes UML](./backend/diagrama_classes_emporio_henz.pdf).
- Matriz de perfis (Administrador, Vendedor, Cliente) e controle de acesso multi-empresa.

### 4. 🎨 [frontend/](./frontend) — Interface e Design System

- Aplicação Single Page Application (SPA) em Vue 3, Vite, Tailwind CSS v4 e Pinia.
- [Catálogo do Design System & Cores](./frontend/design-system-cores.md) com tabela completa de tokens semânticos baseados no Figma.

### 5. 🏗️ [infra/](./infra) — Infraestrutura, Docker e Deploy

- Orquestração de containers com Docker Compose (`postgres`, `migration`, `backend`, `nginx`).
- Scripts operacionais de deploy automatizado (`deploy.sh`) e rotinas de salvaguarda.
- [Guia Operacional de Backup e Restauração](./infra/backup-restore-guide.md).
