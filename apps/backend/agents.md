# Diretrizes e Padrões — Backend (`apps/backend`)

> [!IMPORTANT]
> **ATENÇÃO:**
>
> - Antes de trabalhar no backend, siga a hierarquia de [`agents.md`](../../agents.md): o [`docs/PRD.md`](../../docs/PRD.md) define produto e regras de negócio; este arquivo define apenas como implementá-los no backend.
> - **NOVAS FUNCIONALIDADES DEVEM PASSAR PELO OPENSPEC:** Ao solicitar ou desenvolver novos endpoints ou features, sempre alertar e direcionar o usuário para o fluxo do OpenSpec (`openspec-explore` e `openspec-propose`).
> - **ESTRATÉGIA DATABASE FIRST:** Nenhuma rota ou lógica de servidor deve ser criada antes do esquema de dados no PostgreSQL estar validado. Consulte [docs/padrao-historias-tarefas.md](../../docs/padrao-historias-tarefas.md).
> - **ATUALIZAÇÃO OBRIGATÓRIA DA COLLECTION BRUNO:** Ao criar, alterar ou remover qualquer rota, parâmetro, payload, status ou resposta, atualize na mesma mudança a collection Bruno em [docs/backend/collections/bruno/](../../docs/backend/collections/bruno/). Essa collection é a fonte de consulta da API. Se a alteração introduzir ou modificar regra de negócio, atualize primeiro o PRD.

---

## 1. Stack Tecnológico

O backend roda em Bun com TypeScript estrito, usando o servidor HTTP nativo do runtime, sem frameworks HTTP pesados. A persistência é PostgreSQL. Regras de produto e modelo conceitual pertencem ao [PRD](../../docs/PRD.md); detalhes de persistência pertencem à [documentação de database](../../docs/database/README.md). A porta padrão de desenvolvimento é 3001, configurável por variável de ambiente. O CORS deve aceitar preflight e as origens do frontend local.

---

## 2. Padrões de Roteamento e Respostas HTTP

As respostas JSON e os cabeçalhos de CORS devem ser padronizados pela função auxiliar já existente no projeto, sem reinventar serialização por rota. Erros de recurso inexistente e falhas internas devem seguir o formato JSON uniforme já usado pela API, com códigos HTTP semânticos. Qualquer variável de ambiente nova precisa ser declarada no `turbo.json` para não violar a regra de variáveis não declaradas. Imports internos usam o alias da pasta `src/` e o alias do pacote de database.

---

## 3. Collection Bruno (fonte de consulta da API)

Endpoints, métodos, payloads, headers, ambientes e autenticação são consultados na collection Bruno em [docs/backend/collections/bruno/](../../docs/backend/collections/bruno/). Não mantenha um segundo inventário de rotas neste arquivo. A collection é organizada por domínio, com ambientes local e Docker. O login e o autocadastro salvam o JWT no ambiente para as demais requisições autenticadas. A tarefa de backend não está concluída enquanto a collection não representar o comportamento implementado.

---

## 4. Comandos do Backend

Use os scripts do pacote `apps/backend` via Bun: desenvolvimento com recarga automática, testes, lint, checagem de tipos, build e execução do bundle de produção. Não documente a invocação desses scripts neste arquivo; o README do serviço e o `package.json` são a referência operacional.
