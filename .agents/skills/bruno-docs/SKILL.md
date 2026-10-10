---
name: bruno-docs
description: Gera e atualiza a documentação das rotas do backend na collection Bruno (docs/backend/collections/bruno/), criando ou corrigindo arquivos .bru a partir das rotas, schemas e controllers implementados. Use quando o usuário pedir para documentar rotas, endpoints ou a API, mencionar Bruno, Postman, collection ou .bru, ou ao criar, alterar ou remover qualquer rota em backend/src/modules.
---

# Bruno Docs

A collection em `docs/backend/collections/bruno/` é a fonte de consulta da API. Toda rota do backend precisa de uma requisição `.bru` que reflita o comportamento implementado.

## Início rápido

Na raiz do repositório:

```bash
bun .agents/skills/bruno-docs/scripts/check-routes.ts
```

O script lista rotas sem `.bru` e `.bru` sem rota (código de saída 1 se houver diferença). Ele compara só método e caminho; payload, parâmetros e textos de `docs` são revisados à mão.

## Fluxo

1. **Levantar o escopo.** Rode o script. Se o pedido for sobre rotas recém-feitas, use também `git diff --name-only main...HEAD -- backend/src` para achar os módulos alterados, mesmo que o caminho já exista na collection.
2. **Ler a implementação de cada rota**, nunca inferir pelo nome:
   - `backend/src/routes/index.ts`: prefixo em que o módulo é montado.
   - `<módulo>.routes.ts`: método, caminho e middlewares (`authMiddleware`, `attachUserIfAuthenticated`, `requireRole`).
   - `<módulo>.schema.ts`: campos, obrigatoriedade, limites, query params e mensagens de erro.
   - `<módulo>.controller.ts` e `<módulo>.service.ts`: status de sucesso e de erro (`400`, `401`, `403`, `404`, `409`).
3. **Criar ou atualizar os `.bru`** seguindo [REFERENCE.md](REFERENCE.md). Uma pasta por domínio, com `folder.bru`.
4. **Remover** os `.bru` de rotas que deixaram de existir.
5. **Rodar o script de novo** até sair com código 0.

## Regras

- Texto de `meta.name` e de `docs` em português; nome do arquivo e da pasta em inglês (`Create Category.bru`, pasta `Categories`).
- URL sempre com `{{baseUrl}}`, que já inclui `/api/v1`. Nunca escreva host ou prefixo fixo.
- Rota protegida usa `auth: bearer` com `{{token}}`. Rota pública usa `auth: none`.
- Rota com autenticação opcional que muda a resposta conforme o perfil ganha duas requisições: a pública e a variante com token (ex.: `List Categories.bru` e `List Categories Admin.bru`).
- O bloco `docs` descreve o que o código faz: quem pode chamar, campos e limites, e cada status de erro com sua causa. Não documente comportamento que não está implementado.
- Regras que valem para todas as requisições do domínio ficam no `docs` do `folder.bru`, não repetidas em cada arquivo.
- Exemplos de body usam dados plausíveis do domínio; IDs usam `00000000-0000-0000-0000-000000000000`. Nunca coloque credenciais ou tokens reais.
- Não altere o código do backend por esta skill. Divergência entre código e PRD deve ser reportada ao usuário.

## Checklist

- [ ] Script sai com código 0.
- [ ] Método, caminho, path params e query params batem com `routes` e `schema`.
- [ ] Body de exemplo passa na validação do schema.
- [ ] `auth` condiz com os middlewares da rota.
- [ ] `docs` cobre permissões e todos os status de erro retornados.
- [ ] `seq` sem repetição dentro da pasta.
