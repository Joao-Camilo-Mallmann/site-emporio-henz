# Collection de Teste de API (Bruno) — Empório Henz

Este diretório contém a collection oficial para teste e homologação da API REST V1 do Empório Henz no **[Bruno](https://www.usebruno.com/)** (ferramenta recomendada, git-friendly, offline e declarativa).

---

## 📁 Estrutura de Arquivos

```text
docs/backend/collections/
├── bruno/                                           # Collection nativa do Bruno
│   ├── bruno.json                                   # Manifesto da collection Bruno
│   ├── environments/
│   │   ├── Local.bru                                # Variáveis para ambiente local (porta 3001)
│   │   └── Docker.bru                               # Variáveis para ambiente Docker/Nginx (porta 80)
│   ├── Auth/                                        # Autocadastro, Login e Me (/api/v1/auth)
│   ├── Health/                                      # Healthcheck do servidor (/api/v1/health)
│   ├── Suppliers/                                   # CRUD de fornecedores (/api/v1/suppliers)
│   ├── Users/                                       # CRUD administrativo de usuários (/api/v1/users)
│   └── User-Suppliers/                              # Vínculos vendedor-fornecedor (/api/v1/users/:id/suppliers)
└── README.md                                        # Este guia de uso
```

---

## ⚡ Como Usar no Bruno

O [Bruno](https://www.usebruno.com/) armazena as requisições em arquivos de texto plano (`.bru`), permitindo versionamento direto no Git e revisões de código claras.

### Passo a passo:
1. Abra o Bruno.
2. Clique em **"Open Collection"**.
3. Selecione a pasta:
   ```
   docs/backend/collections/bruno
   ```
4. No canto superior direito da tela do Bruno, selecione o Environment desejado:
   - **`Local`**: Para testes com `bun dev` na porta `3001` (`http://localhost:3001/api/v1`).
   - **`Docker`**: Para testes com Docker Compose / Nginx na porta `80` (`http://localhost/api/v1`).
5. **Autenticação Automática**:
   - Ao executar a requisição `Auth > Login` (credenciais padrão `admin@gmail.com` / `admin123`) ou `Auth > Autocadastro de Cliente`, o script pós-resposta (`script:post-response`) salvará automaticamente o JWT gerado na variável `token` do environment selecionado.
   - Todas as requisições autenticadas (`Users`, `Suppliers`, `User-Suppliers`, `Me`) já utilizam `{{token}}` no cabeçalho Bearer Token e funcionarão imediatamente.

---

## 🔒 Resumo de Permissões das Rotas

| Módulo | Endpoint | Permissão Mínima |
| :--- | :--- | :--- |
| **Health** | `GET /api/v1/health` | Público |
| **Auth** | `POST /api/v1/auth/register` | Público |
| **Auth** | `POST /api/v1/auth/login` | Público (`admin@gmail.com` / `admin123`) |
| **Auth** | `GET /api/v1/auth/me` | Qualquer autenticado |
| **Users** | `GET /api/v1/users` | Admin (`role = 3`) |
| **Users** | `POST /api/v1/users` | Admin (`role = 3`) |
| **Users** | `GET /api/v1/users/:id` | Admin (`role = 3`) |
| **Users** | `PUT /api/v1/users/:id` | Admin (`role = 3`) |
| **Users** | `DELETE /api/v1/users/:id` | Admin (`role = 3`) |
| **Suppliers** | `GET /api/v1/suppliers` | Vendedor (`role = 2`) ou Admin (`role = 3`) |
| **Suppliers** | `GET /api/v1/suppliers/:id` | Vendedor (`role = 2`) ou Admin (`role = 3`) |
| **Suppliers** | `POST /api/v1/suppliers` | Admin (`role = 3`) |
| **Suppliers** | `PUT /api/v1/suppliers/:id` | Admin (`role = 3`) |
| **Suppliers** | `DELETE /api/v1/suppliers/:id` | Admin (`role = 3`) |
| **User-Suppliers** | `GET /api/v1/users/:userId/suppliers` | Admin (`role = 3`) |
| **User-Suppliers** | `POST /api/v1/users/:userId/suppliers` | Admin (`role = 3`) |
| **User-Suppliers** | `DELETE /api/v1/users/:userId/suppliers/:supplierId` | Admin (`role = 3`) |

---

> [!IMPORTANT]
> **REGRA DE ATUALIZAÇÃO OBRIGATÓRIA:**
> Sempre que qualquer rota for adicionada, modificada ou removida em `apps/backend/src/`, a collection do Bruno em `docs/backend/collections/bruno/` e os arquivos de documentação (`docs/rotas-api-frontend.md` e `docs/backend/README.md`) **DEVEM ser atualizados imediatamente**.
