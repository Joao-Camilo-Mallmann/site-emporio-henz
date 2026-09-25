# Documentação do projeto — Empório Henz

Este índice orienta pessoas e agentes de IA para a fonte correta, sem duplicar regras entre documentos.

## Ordem de autoridade

1. **[PRD.md](./PRD.md)** — única fonte da verdade para visão, escopo, requisitos e regras de negócio.
2. **[padrao-historias-tarefas.md](./padrao-historias-tarefas.md)** — fonte normativa para planejamento, decomposição e execução.
3. **Documentação técnica por domínio** — descreve como cada camada implementa o PRD.
4. **[planning/user-stories-backlog.md](./planning/user-stories-backlog.md)** — visão de execução derivada do PRD.
5. **[product/perguntas-cliente.md](./product/perguntas-cliente.md)** — material de descoberta; decisões confirmadas devem ser incorporadas ao PRD.

Se uma regra de negócio surgir ou mudar, atualize primeiro o PRD. Nenhum README, backlog, OpenSpec, issue, collection Bruno ou código pode estabelecer sozinho uma regra de produto.

## Mapa da documentação

```text
docs/
├── README.md
├── PRD.md                          # SSOT de produto e regras de negócio
├── padrao-historias-tarefas.md     # Processo oficial de histórias e tarefas
├── product/
│   └── perguntas-cliente.md        # Insumos de descoberta ainda não normativos
├── planning/
│   └── user-stories-backlog.md     # Execução derivada do PRD
├── database/
│   ├── README.md
│   ├── diagram.png
│   └── der_emporio_henz.pdf
├── backend/
│   ├── README.md
│   ├── diagrama_classes_emporio_henz.pdf
│   └── collections/
│       ├── README.md
│       └── bruno/                  # Fonte de consulta da API (executável e versionada)
├── frontend/
│   ├── README.md
│   └── design-system-cores.md
└── infra/
    ├── README.md
    └── backup-restore-guide.md
```

## Responsabilidade por domínio

- **[database/](./database/README.md)**: persistência PostgreSQL, migrações, integridade e diagramas.
- **[backend/](./backend/README.md)**: arquitetura de servidor, segurança e implementação da API.
- **[backend/collections/](./backend/collections/README.md)**: fonte de consulta da API. Toda alteração de rota, payload, status ou resposta atualiza a collection Bruno na mesma mudança.
- **[frontend/](./frontend/README.md)**: arquitetura Vue, integração, estado e UI.
- **[frontend/design-system-cores.md](./frontend/design-system-cores.md)**: tokens visuais canônicos.
- **[infra/](./infra/README.md)**: Docker, deploy, backup e operação.

## Checklist de manutenção

- Regra de produto alterada: PRD atualizado primeiro.
- Tarefa criada ou alterada: padrão respeitado e backlog sincronizado.
- API alterada: collection Bruno sincronizada.
- Decisão técnica alterada: README do domínio atualizado.
- Referência movida: links internos revisados.
