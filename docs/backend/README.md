# Back-end

Documentação técnica da API do Empório Henz. Regras de negócio pertencem ao [PRD](../PRD.md); este guia descreve a implementação no serviço `backend/`.

## Referências

- [Código do serviço](../../backend/)
- [README operacional do serviço](../../backend/README.md)
- [Regras do back-end](../../backend/agents.md)
- [Collection Bruno](./collections/README.md)
- [Banco de dados](../database/README.md)

## Stack e convenções

- Bun com `Bun.serve` e TypeScript estrito.
- PostgreSQL 16 com driver SQL nativo do Bun.
- API versionada sob `/api/v1`.
- Senhas protegidas com Argon2id e sessões com JWT.
- Testes unitários e de integração com `bun:test`.
- Exclusão lógica por `deleted_at` nas entidades de negócio.

## Estrutura do código

| Diretório | Responsabilidade |
| --- | --- |
| `backend/src/config/` | Ambiente e conexão com o banco |
| `backend/src/lib/` | Roteador, respostas HTTP, JWT, senhas e erros |
| `backend/src/middlewares/` | Autenticação, RBAC e tratamento de erros |
| `backend/src/modules/` | Controllers, serviços, repositórios, schemas e tipos por domínio |
| `backend/src/routes/` | Composição das rotas da API V1 |
| `backend/database/` | Migrações e dados iniciais |
| `backend/tests/` | Testes automatizados |

Módulos atualmente registrados: autenticação, usuários, fornecedores, vínculos entre usuários e fornecedores e produtos.

## Contrato HTTP

Erros seguem o formato:

```json
{
  "error": "NomeDoErro",
  "message": "Descrição amigável da falha."
}
```

Listagens são paginadas (RNF11 do PRD) e seguem o formato:

```json
{
  "data": [],
  "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 1 }
}
```

Parâmetros `page` e `limit` de cada rota estão na collection Bruno.

Status utilizados: `200`, `201`, `204`, `400`, `401`, `403`, `404`, `409` e `500`.

Papéis de acesso:

| Papel | Valor |
| --- | ---: |
| Cliente | `1` |
| Vendedor | `2` |
| Administrador | `3` |

O servidor aplica as permissões; ocultar ações no front-end não substitui a validação RBAC.

## Executar

```bash
cd backend
bun install
bun run migrate
bun run dev
```

A API fica disponível em `http://localhost:3001/api/v1` e o healthcheck em `GET /api/v1/health`.

## Validar

```bash
cd backend
bun run check-types
bun run lint
bun test
bun run build
```

Para testar os contratos manualmente, abra `docs/backend/collections/bruno` no Bruno. Alterações de rota, parâmetro, payload, status ou resposta devem atualizar essa collection na mesma entrega.
