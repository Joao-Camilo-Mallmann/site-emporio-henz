# Padrão de Commits e Pull Requests

## Portal Empório Henz · Engenharia de Software e Governança

Este documento define como escrever mensagens de commit, títulos e descrições de Pull Request, e como revisar. Ele complementa a [seção 6 do padrão de histórias e tarefas](./padrao-historias-tarefas.md#6-rastreabilidade-com-git-e-openspec), que trata de branches, issues e OpenSpec.

---

## 1. Mensagem de Commit

### 1.1. Formato

```text
<tipo>(<escopo>): <resumo no infinitivo>

<corpo: o que mudou e por quê>

<rodapé: referências e trailers>
```

Exemplo:

```text
feat(backend): paginar listagem de fornecedores do usuário

A rota GET /api/user-suppliers devolvia todos os vínculos de uma vez,
o que ficava lento com muitos registros. Agora aceita page e limit e
devolve o bloco pagination padrão da API.

Closes #41
Refs: US-BE-18
```

### 1.2. Tipo

| Tipo       | Quando usar                                                                                                   | Versionamento semântico |
| ---------- | ------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `feat`     | Novo recurso, visível para o usuário ou para a API                                                            | MINOR                   |
| `fix`      | Correção de um problema (bug fix)                                                                             | PATCH                   |
| `docs`     | Mudanças na documentação, como o README. Não inclui alterações em código                                      | —                       |
| `test`     | Criação, alteração ou exclusão de testes, unitários ou de integração. Não inclui alterações em código         | —                       |
| `build`    | Mudanças em arquivos de build e dependências, como `package.json` e lockfiles                                 | —                       |
| `perf`     | Alterações de código cujo objetivo é desempenho                                                               | —                       |
| `style`    | Formatação, ponto e vírgula, espaços no fim da linha, lint. Não inclui alterações em código                   | —                       |
| `refactor` | Mudança de estrutura que mantém a funcionalidade, inclusive limpezas vindas de code review                    | —                       |
| `chore`    | Configurações, administração e pacotes, como incluir uma entrada no `.gitignore`. Não inclui alterações em código | —                       |
| `ci`       | Pipeline, GitHub Actions e automação de deploy                                                                | —                       |
| `revert`   | Reversão de um commit anterior (cite o hash no corpo)                                                         | —                       |

Regras de leitura da tabela:

- Tipos marcados com "Não inclui alterações em código" (`docs`, `test`, `style`, `chore`) não podem alterar código de produção. Se alterarem, o tipo correto é outro, por exemplo `fix` ou `refactor`.
- `perf` é para mudanças cujo objetivo é desempenho. Reestruturações sem esse objetivo, inclusive as vindas de code review, são `refactor`.

### 1.3. Escopo

Use a camada ou a área afetada, em minúsculas e sem acento:

- Camadas: `database`, `backend`, `frontend`, `infra`, `openspec`.
- Área de negócio, quando a mudança cabe em uma só: `auth`, `catalogo`, `admin`, `listas`.
- Omita o escopo apenas quando a mudança atravessa várias áreas e nenhuma se destaca.

### 1.4. Resumo (primeira linha)

- Até 72 caracteres. Prefira até 50.
- No infinitivo, em português: `paginar`, `corrigir`, `remover`, `formatar`.
- Sem ponto final.
- Descreve o efeito no sistema, não a atividade. Teste: "Se aplicado, este commit vai <resumo>".
- Não usar termos vagos como `update`, `ajustes`, `melhorias`, `wip`, `correções diversas`.

### 1.5. Corpo

- **Obrigatório** quando o diff não explica sozinho o motivo: mudança de regra, decisão técnica, trade-off, workaround ou causa de um bug.
- **Dispensável** em mudanças triviais, como correção de digitação ou remoção de import não usado.
- Explique o porquê. O diff já mostra o quê.
- Quebre as linhas em cerca de 72 colunas. Frases curtas e listas com `-` são bem-vindas.

### 1.6. Rodapé

- `Closes #N`: fecha a issue quando o commit chega à branch principal. Uma por linha.
- `Refs: #N` ou `Refs: US-XX-NN`: relaciona sem fechar.
- `BREAKING CHANGE: <o que quebra e como migrar>`: obrigatório quando um contrato de API, payload ou schema deixa de ser compatível. Use também `!` após o tipo, por exemplo `feat(backend)!: ...`. Equivale ao MAJOR do versionamento semântico.
- Trailers de atribuição de IA, quando houver (ver seção 4).

### 1.7. Granularidade

- Um commit representa uma mudança lógica.
- Formatação, renomeação e mudança de comportamento ficam em commits separados. Assim o histórico continua revisável.
- Dentro de uma tarefa de camada, prefira commits que fiquem na camada da tarefa. Um commit `[FE]` que altera `backend/` deve justificar isso no corpo.
- Não usar nome de branch como mensagem de commit ou de merge.

### 1.8. Idioma

- Português do Brasil, com acentuação correta.
- Termos técnicos consagrados podem ficar em inglês: `endpoint`, `commit`, `payload`, `seed`, `middleware`.

---

## 2. Pull Request

### 2.1. Título

- Usa o mesmo formato do resumo de commit (seção 1.4), sem o rodapé.
- Termina com a tag da história quando houver, por exemplo `[US-FE-11]`.
- O título vira a mensagem do merge commit na branch principal. Por isso precisa fazer sentido sozinho.

Exemplo: `feat(frontend): área Minhas Listas com navegação em dois níveis [US-FE-11]`

### 2.2. Descrição

A descrição é preenchida pelo template [`.github/pull_request_template.md`](../.github/pull_request_template.md). Cada seção responde a uma pergunta do revisor:

| Seção                               | Pergunta que responde                                              |
| ----------------------------------- | ------------------------------------------------------------------ |
| Resumo                              | O que muda e por quê, em 2 a 4 frases?                             |
| Tarefa                              | Qual issue e qual história esta PR fecha?                          |
| Camadas afetadas                    | Quais camadas `[DB]`, `[BE]`, `[FE]`, `[TEST]`, `[INFRA]` mudaram? |
| Como validar                        | Quais passos reproduzem o funcionamento?                           |
| Checklist                           | Os artefatos derivados foram atualizados?                          |
| Pontos de atenção para o revisor    | Onde estão as decisões, os trade-offs e o que não foi testado?     |

### 2.3. Tamanho

- Alvo: até cerca de 400 linhas alteradas. Lock files, assets e collections geradas não contam.
- Se passar disso, confira se a tarefa pode ser dividida por camada, como manda o [padrão de tarefas](./padrao-historias-tarefas.md). Se não puder, justifique na seção de pontos de atenção.

### 2.4. Antes de pedir revisão (autor)

1. Revise o próprio diff na aba **Files changed** do GitHub, como se fosse o revisor.
2. Rode os testes, o build e os comandos do diretório afetado com Bun.
3. Confirme que nenhum `.env`, segredo ou arquivo gerado entrou no diff.
4. Atualize os artefatos exigidos pelo [`agents.md`](../agents.md): backlog, `tasks.md` do OpenSpec, PRD e collection Bruno, conforme o caso.
5. Se ainda não estiver pronta, abra como **draft**.

---

## 3. Revisão

### 3.1. O que o revisor verifica, nesta ordem

1. **Regra de negócio**: o comportamento bate com o [PRD](./PRD.md) e com os critérios de aceitação da história?
2. **Contrato**: rotas, payloads, status HTTP e collection Bruno estão alinhados?
3. **Dados**: migrações, constraints e soft delete estão corretos, quando a PR toca `[DB]`?
4. **Código**: nomes claros, sem duplicação desnecessária, erros tratados e sem abstração que a história não pede?
5. **Validação**: a seção "Como validar" é suficiente para reproduzir o resultado?
6. **Estilo**: o que o formatador e o linter não cobrem.

Os itens 1 e 2 vêm antes de tudo de propósito. Código limpo que implementa a coisa errada ainda é um problema.

### 3.2. Como comentar

Use um prefixo para deixar claro o peso do comentário:

| Prefixo       | Significado                                                        |
| ------------- | ------------------------------------------------------------------ |
| `bloqueante:` | Precisa ser resolvido antes do merge                               |
| `sugestão:`   | Melhoria opcional. O autor decide                                  |
| `pergunta:`   | Dúvida. Não exige mudança por si só                                |
| `nit:`        | Detalhe pequeno de estilo. Não bloqueia                            |

- Diga qual é o problema e, quando possível, qual seria o caminho.
- Comente o código, não a pessoa.
- Se a mudança sugerida for grande, abra uma issue e referencie-a no comentário.

### 3.3. Como responder e encerrar

- O autor responde a cada comentário: informando o commit que resolveu ou justificando por que não mudou.
- Quem abriu a thread é quem a resolve.
- Durante a revisão ativa, evite reescrever o histórico com force push. Ele apaga o contexto dos comentários. Commits novos são preferíveis.
- O merge só acontece com aprovação e sem nenhum `bloqueante:` aberto.

---

## 4. Atribuição de IA

Commits e Pull Requests criados com agentes de IA recebem o trailer de atribuição do agente:

- Commit: `Co-Authored-By: <modelo> <noreply@anthropic.com>`, no rodapé.
- Pull Request: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`, ao final da descrição.

O modelo informado no `Co-Authored-By` é o que executou o trabalho. Não remova esses trailers ao editar a mensagem.

---

## 5. Exemplos: ruim e bom

| Ruim                                                                 | Bom                                                                           |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `Improve code formatting and readability in MinhasListasModal`       | `style(frontend): formatar MinhasListasModal sem alterar comportamento`       |
| `Us fe 11 área minhas listas` (título do merge)                      | `feat(frontend): área Minhas Listas com navegação em dois níveis [US-FE-11]` |
| `ajustes`                                                            | `fix(backend): impedir vínculo duplicado de fornecedor ao usuário`            |
| `update`                                                             | `chore(infra): fixar versão da imagem do PostgreSQL no compose`               |
| `feat: implement pagination for suppliers and user-suppliers endpoints` | `feat(backend): paginar listagem de fornecedores e vínculos do usuário`    |
| `wip`                                                                | Não commitar em branch compartilhada. Use commit com resumo real ou faça stash |

---

## 6. Manutenção

- Mudança neste padrão: atualizar este arquivo e, se o template mudar, [`.github/pull_request_template.md`](../.github/pull_request_template.md) na mesma entrega.
- Regra de processo de tarefas (branches, issues, camadas): [padrão de histórias e tarefas](./padrao-historias-tarefas.md).
- Regra de produto: [PRD](./PRD.md), antes de qualquer outro artefato.
