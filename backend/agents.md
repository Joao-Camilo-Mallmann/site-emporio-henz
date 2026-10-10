# Diretrizes e Padrões — Backend (`backend`)

## Escopo

Este arquivo é o contexto completo do ambiente **backend**, que reúne API e banco de dados: cobre `backend/` (incluindo `backend/database/`), `docs/backend/` e `docs/database/`. Tarefas `[DB]` e `[BE]` não precisam ler `frontend/agents.md` nem `docs/frontend/`.

- A única ponte com o frontend é o [PRD](../docs/PRD.md) (regras de negócio) e a [collection Bruno](../docs/backend/collections/bruno/) (contrato da API, mantida por este ambiente).
- Tarefas de interface `[FE]` rodam no ambiente frontend. Se a API mudar, a collection Bruno atualizada é o que a tarefa `[FE]` consome.

> [!IMPORTANT]
> **ATENÇÃO:**
>
> - Antes de trabalhar no backend, siga a hierarquia de [`agents.md`](../agents.md): o [`docs/PRD.md`](../docs/PRD.md) define produto e regras de negócio; este arquivo define apenas como implementá-los no backend.
> - **NOVAS FUNCIONALIDADES DEVEM PASSAR PELO OPENSPEC:** Ao solicitar ou desenvolver novos endpoints ou features, sempre alertar e direcionar o usuário para o fluxo do OpenSpec (`openspec-explore` e `openspec-propose`).
> - **ESTRATÉGIA DATABASE FIRST:** Nenhuma rota ou lógica de servidor deve ser criada antes do esquema de dados no PostgreSQL estar validado: modele e valide o banco antes do backend e do frontend (`[DB]` → `[BE]` → `[FE]`). Consulte [docs/padrao-historias-tarefas.md](../docs/padrao-historias-tarefas.md).
> - **ATUALIZAÇÃO OBRIGATÓRIA DA COLLECTION BRUNO:** Ao criar, alterar ou remover qualquer rota, parâmetro, payload, status ou resposta, atualize na mesma mudança a collection Bruno em [docs/backend/collections/bruno/](../docs/backend/collections/bruno/). Essa collection é a fonte de consulta da API. Se a alteração introduzir ou modificar regra de negócio, atualize primeiro o PRD.

---

## 1. Stack Tecnológico

O backend roda em Bun com TypeScript estrito, usando o servidor HTTP nativo do runtime, sem frameworks HTTP pesados. A persistência é PostgreSQL. Regras de produto e modelo conceitual pertencem ao [PRD](../docs/PRD.md); detalhes de persistência pertencem à [documentação de database](../docs/database/README.md). A porta padrão de desenvolvimento é 3001, configurável por variável de ambiente. O CORS deve aceitar preflight e as origens do frontend local.

---

## 2. Padrões de Roteamento e Respostas HTTP

As respostas JSON e os cabeçalhos de CORS devem ser padronizados pela função auxiliar já existente no projeto, sem reinventar serialização por rota. Erros de recurso inexistente e falhas internas devem seguir o formato JSON uniforme já usado pela API, com códigos HTTP semânticos. Qualquer variável de ambiente nova precisa ser declarada no `.env.example`. Imports internos usam o alias da pasta `src/` (`@/*`) ou caminhos relativos para `database/`.

---

## 3. Collection Bruno (fonte de consulta da API)

Endpoints, métodos, payloads, headers, ambientes e autenticação são consultados na collection Bruno em [docs/backend/collections/bruno/](../docs/backend/collections/bruno/). Não mantenha um segundo inventário de rotas neste arquivo. A collection é organizada por domínio, com ambientes local e Docker. O login e o autocadastro salvam o JWT no ambiente para as demais requisições autenticadas. A tarefa de backend não está concluída enquanto a collection não representar o comportamento implementado.

---

## 4. Comandos do Backend

Use os scripts do `backend` via Bun: desenvolvimento com recarga automática, testes, lint, checagem de tipos, migrações, seed, build e execução do bundle de produção. Não documente a invocação desses scripts neste arquivo; o README do serviço e o `package.json` são a referência operacional.

---

## 5. Tipos e Interfaces

Toda `interface` e todo `type` nomeado de um módulo vivem no arquivo `<módulo>.types.ts` dele, incluindo DTOs, filtros, resultados paginados e tipos de linha do banco (`*DbRow`). Controllers, services, repositories, schemas e routes apenas importam esses tipos, sem declará-los localmente. Quando um módulo precisar de um tipo de outro, importe do `types.ts` do módulo dono em vez de duplicar a declaração.

---

## 6. Paginação de Listagens

Toda rota que devolve uma coleção plana de registros é paginada, conforme o RNF11 do [PRD](../docs/PRD.md). O padrão vive em `src/lib/pagination.ts` e não deve ser reimplementado por módulo:

- O schema do módulo lê a query com `parsePagination` (e `parseSearch`, quando houver busca) e devolve o filtro tipado.
- O repository calcula `page`, `limit` e `offset` com `resolvePagination`, escapa o termo de busca com `escapeLike` e monta a resposta com `paginate`.
- O tipo de retorno é um alias de `Paginated<T>` declarado no `<módulo>.types.ts` (por exemplo `PaginatedSuppliersResult`). `Paginated<T>` e `PaginationParams` são os únicos tipos compartilhados que ficam em `src/lib/`.
- A contagem total e a página usam exatamente os mesmos filtros no `WHERE`.

Não devolva array puro em rota de listagem nem crie outro formato de envelope. As exceções são as definidas no PRD.

---

## 7. Soft Delete e Integridade

Use soft delete e as regras de integridade conforme o [PRD](../docs/PRD.md) e a [documentação de database](../docs/database/README.md).

---

## 8. Manutenção Documental

| Mudança                                              | Atualizações obrigatórias                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Regra, requisito, escopo ou comportamento do produto | [`docs/PRD.md`](../docs/PRD.md), antes de qualquer outro artefato                           |
| Modelo conceitual ou persistência                    | PRD, quando afetar o produto, + [`docs/database/README.md`](../docs/database/README.md)     |
| Endpoint, payload, parâmetro, status ou resposta     | collection Bruno em [`docs/backend/collections/bruno/`](../docs/backend/collections/bruno/) |
