# Collection Bruno da API

A pasta [`bruno/`](./bruno/) é o contrato executável da API REST V1 do Empório Henz. Os arquivos `.bru` registram rotas, parâmetros, payloads, autenticação e exemplos de resposta sem depender de documentação paralela.

## Abrir a collection

1. Inicie a API.
2. Abra o Bruno e escolha **Open Collection**.
3. Selecione `docs/backend/collections/bruno`.
4. Escolha um ambiente:
   - `Local`: `http://localhost:3001/api/v1`
   - `Docker`: `http://localhost/api/v1`
5. Execute `Auth > Login`. O script pós-resposta armazena o JWT em `{{token}}`.

Credenciais administrativas de desenvolvimento:

```text
admin@gmail.com
admin123
```

## Permissões resumidas

| Módulo | Acesso |
| --- | --- |
| Health | Público |
| Cadastro e login | Público |
| Perfil autenticado | Qualquer usuário autenticado |
| Usuários | Administrador |
| Leitura de fornecedores | Vendedor ou administrador |
| Escrita de fornecedores | Administrador |
| Vínculos vendedor-fornecedor | Administrador |
| Recomendações de produtos | Público |

Consulte cada requisição `.bru` para o método, caminho e payload exatos.

## Regra de manutenção

Toda alteração em rota, parâmetro, payload, status ou resposta de `backend/src/` deve atualizar a collection na mesma entrega. Se a mudança afetar comportamento ou regra de negócio, atualize primeiro o [PRD](../../PRD.md).
