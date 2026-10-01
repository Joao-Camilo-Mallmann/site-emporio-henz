# Documentação — Empório Henz

Este diretório reúne a documentação de produto, planejamento e implementação do portal. Use este arquivo como ponto de entrada; cada assunto possui uma fonte canônica para evitar informações duplicadas ou contraditórias.

## Por onde começar

| Objetivo | Documento |
| --- | --- |
| Entender o produto e as regras de negócio | [PRD](./PRD.md) |
| Consultar o andamento das histórias | [Backlog de histórias](./planning/user-stories-backlog.md) |
| Criar histórias, tarefas e issues | [Padrão de histórias e tarefas](./padrao-historias-tarefas.md) |
| Entender o banco e as migrações | [Banco de dados](./database/README.md) |
| Desenvolver ou consultar a API | [Back-end](./backend/README.md) |
| Testar endpoints | [Collection Bruno](./backend/collections/README.md) |
| Desenvolver interfaces | [Front-end](./frontend/README.md) |
| Consultar cores e tokens visuais | [Design system](./frontend/design-system-cores.md) |
| Operar Docker, deploy ou backups | [Infraestrutura](./infra/README.md) |
| Consultar materiais da apresentação | [Apresentação da Parcial 1](./slides/apresentacao-parcial-1.md) |

## Ordem de autoridade

1. [PRD](./PRD.md): fonte da verdade para visão, escopo, requisitos e regras de negócio.
2. [Padrão de histórias e tarefas](./padrao-historias-tarefas.md): processo oficial de planejamento e execução.
3. Documentação técnica de cada domínio: explica como o sistema implementa o PRD.
4. [Backlog](./planning/user-stories-backlog.md): registra a execução derivada do PRD.
5. [Perguntas para o cliente](./product/perguntas-cliente.md): reúne insumos de descoberta ainda não normativos.

Se uma regra de negócio surgir ou mudar, atualize primeiro o PRD. READMEs, backlog, OpenSpec, issues, collection Bruno e código não devem estabelecer isoladamente uma regra de produto.

## Estrutura

```text
docs/
├── README.md                       # Índice da documentação
├── PRD.md                          # Produto e regras de negócio
├── padrao-historias-tarefas.md     # Processo de planejamento e execução
├── product/
│   └── perguntas-cliente.md        # Insumos de descoberta
├── planning/
│   └── user-stories-backlog.md     # Histórias e critérios de aceitação
├── database/
│   └── README.md                   # Persistência e migrações
├── backend/
│   ├── README.md                   # Arquitetura e execução da API
│   └── collections/
│       ├── README.md               # Uso da collection
│       └── bruno/                  # Contrato executável da API
├── frontend/
│   ├── README.md                   # Arquitetura e execução da interface
│   └── design-system-cores.md      # Tokens visuais
├── infra/
│   ├── README.md                   # Docker, deploy e operação
│   └── backup-restore-guide.md     # Backup e restauração
├── slides/                         # Apresentação e roteiro
└── prints/                         # Evidências visuais da aplicação
```

## Responsabilidade de cada domínio

- [Banco de dados](./database/README.md): esquema PostgreSQL, migrações e integridade. O código fica em `backend/database/`.
- [Back-end](./backend/README.md): arquitetura do servidor, segurança e implementação da API.
- [Collection Bruno](./backend/collections/README.md): contrato executável de rotas, payloads, status e respostas.
- [Front-end](./frontend/README.md): arquitetura Vue, integração com a API, estado e interface.
- [Infraestrutura](./infra/README.md): Docker Compose, Nginx, deploy, backup e restauração.

## Manutenção

- Regra, requisito ou escopo de produto: atualizar o PRD primeiro.
- História, tarefa ou critério de aceite: sincronizar o padrão e o backlog.
- Endpoint, payload, status ou resposta: atualizar a collection Bruno na mesma entrega.
- Decisão técnica: atualizar o README do domínio afetado.
- Tarefa concluída: marcar os critérios atendidos no backlog e no `tasks.md` do OpenSpec, quando existir.
- Arquivo movido ou renomeado: revisar todos os links internos.
