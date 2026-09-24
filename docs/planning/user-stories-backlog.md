# Backlog Mestre de Histórias de Usuário (User Stories)

## Portal Empório Henz · Banco de Dados First, Back-end e Front-end

Este documento organiza a execução do portal da Empório Henz em histórias, requisitos técnicos e critérios de aceitação. Ele é derivado do [PRD](../PRD.md), que permanece como única fonte da verdade para produto e regras de negócio. Em caso de divergência, corrija primeiro o PRD e depois sincronize este backlog.

---

## 📑 Sumário

- [Visão Geral e Arquitetura Database First](#-visão-geral-e-arquitetura-database-first)
- [Fase 0: Banco de Dados First (Fundação Estável)](#-fase-0-banco-de-dados-first-fundação-estável)
- [Fase 1: Apresentação - Parcial 1 (10,0 pontos)](#-fase-1-apresentação---parcial-1-100-pontos)
  - [Autenticação e Sessão (2,5 pts)](#autenticação-e-sessão-25-pts)
  - [CRUD 1: Clientes e Pessoas (1,5 pts)](#crud-1-clientes-e-pessoas-15-pts)
  - [CRUD 2: Fornecedores e Marcas Parceiras (1,5 pts)](#crud-2-fornecedores-e-marcas-parceiras-15-pts)
  - [Site Minimamente Funcional com Design Figma (2,0 pts)](#site-minimamente-funcional-com-design-figma-20-pts)
  - [README com Passo a Passo (0,5 pts)](#readme-com-passo-a-passo-05-pts)
  - [Processo e Robustez (2,0 pts)](#processo-e-robustez-20-pts)
- [Fase 2: Apresentação - Parcial 2 / Final (10,0 pontos)](#-fase-2-apresentação---parcial-2--final-100-pontos)
  - [Permissões com Dois Papéis (1,5 pts)](#permissões-com-dois-papéis-15-pts)
  - [CRUD 3: Categorias e Subtipos (0,5 pts)](#crud-3-categorias-e-subtipos-05-pts)
  - [CRUD 4: Produtos, Variações e Fotos (0,5 pts)](#crud-4-produtos-variações-e-fotos-05-pts)
  - [Catálogo Principal e Detalhes do Produto (2,0 pts)](#catálogo-principal-e-detalhes-do-produto-20-pts)
  - [3 Testes Automatizados com bun:test (2,5 pts)](#3-testes-automatizados-com-buntest-25-pts)
  - [Site Inteiro Navegável: Listas, WhatsApp e Tablet (2,0 pts)](#site-inteiro-navegável-listas-whatsapp-e-tablet-20-pts)
  - [Sistema Publicado na VM (1,0 pt)](#sistema-publicado-na-vm-10-pt)
  - [Processo e Robustez Final (2,0 pts)](#processo-e-robustez-final-20-pts)

---

## 🏛️ Visão Geral e Arquitetura Database First

Para garantir integridade contratual e evitar retrabalhos nas camadas de aplicação, o desenvolvimento adota estritamente:

1. **Database First**: Todo o modelo de dados relacional (tabelas, integridade referencial, soft delete com índices parciais e usuário administrador padrão) é finalizado e testado no PostgreSQL antes do consumo pelas APIs e telas.
2. **Decomposição em Camadas**: Cada funcionalidade que requer persistência, lógica e interface é separada em histórias de usuário independentes:
   - `[DB]`: Banco de Dados (`packages/database`)
   - `[BE]`: Back-end em Bun nativo (`apps/backend`)
   - `[FE]`: Front-end em Vue 3 + Tailwind CSS (`apps/web`)
   - `[TEST]`: Testes automatizados (`bun:test`)
   - `[INFRA]`: Conteinerização Docker e Deploy na VM
   - `[DOCS]` / `[CHORE]`: Documentação e Governança OpenSpec

---

# 🗄️ FASE 0: Banco de Dados First (Fundação Estável)

---

### [US-DB-01] Seed do Usuário Administrador Padrão no Banco de Dados

**Como** Administrador da plataforma e membro da banca avaliadora,  
**Quero** que o banco de dados inicialize automaticamente com um usuário Administrador padrão (`admin@gmail.com` / `admin123`),  
**Para que** eu possa acessar o painel administrativo imediatamente em qualquer ambiente sem necessidade de cadastros manuais prévios.

#### 📖 Contexto e Regras de Negócio

Para atender aos testes de bancas avaliadoras e garantir que qualquer inicialização em novo ambiente (inclusive na VM de produção) possua credenciais administrativas ativas, é obrigatório criar uma migração SQL idempotente que insira as credenciais do administrador global com hash seguro.

- O e-mail de acesso deve ser fixado em `admin@gmail.com`.
- O papel (`role`) associado deve ser obrigatoriamente `3` (Administrador).
- A senha em texto puro não pode ser salva; deve ser gerado o hash correspondente a `admin123`.
- A migração deve ser estritamente idempotente (`ON CONFLICT DO NOTHING` ou verificação condicional).

#### 🗄️ Especificação de Banco de Dados (`packages/database`)

- Criar migração SQL `packages/database/migrations/007_seed_default_admin.sql` (sequenciada após as migrações 001-006 das tabelas base).
- Inserir registro na tabela `users` com:
  - `email = 'admin@gmail.com'`
  - `password_hash = <hash gerado via Argon2id>`
  - `role = 3`
  - `created_at = CURRENT_TIMESTAMP`
  - `deleted_at = NULL`
- Inserir registro correspondente na tabela `clients` com:
  - `user_id = <id do user>`
  - `full_name = 'Administrador Geral'`
  - `phone = '(51) 99999-9999'`

#### ✅ Critérios de Aceitação

- [x] A migração `007_seed_default_admin.sql` roda sem erros através de `bun run migrate` ou script `bun run seed`.
- [x] Executar a migração múltiplas vezes não gera duplicidade nem erro de unicidade (idempotência garantida).
- [x] A tabela `users` contém o registro do admin com `role = 3` e `deleted_at IS NULL`.
- [x] A senha criptografada permite autenticação imediata pelo backend com `admin123` via Argon2id.

---

### [US-DB-02] Auditoria Estrutural e Validação dos Índices Parciais de Soft Delete

**Como** Arquiteto de Software,  
**Quero** auditar todas as tabelas e índices do PostgreSQL,  
**Para que** a regra estrita de exclusão lógica (Soft Delete - RNF08) funcione com integridade referencial e sem conflitos de chave única com registros inativos.

#### 📖 Contexto e Regras de Negócio

O RNF08 do PRD estabelece que nenhuma exclusão física (`DELETE`) pode ocorrer no banco de dados. Todas as entidades (`users`, `clients`, `categories`, `product_subtypes`, `suppliers`, `products`, `product_variations`, `product_images`, `lists`, `list_items`, `user_suppliers`) devem possuir a coluna `deleted_at TIMESTAMP WITH TIME ZONE`. Campos únicos (como `email` em `users`, `slug` em `categories` e `products`, e `share_slug` em `lists`) precisam de índices parciais (`WHERE deleted_at IS NULL`) para que registros excluídos logicamente não impeçam novos cadastros com o mesmo identificador.

#### 🗄️ Especificação de Banco de Dados (`packages/database`)

- Verificar a existência e tipagem de `deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL` em todas as tabelas.
- Validar os índices parciais únicos:
  - `idx_users_email_active ON users (email) WHERE deleted_at IS NULL`
  - `idx_categories_slug_active ON categories (slug) WHERE deleted_at IS NULL`
  - `idx_subtypes_slug_active ON product_subtypes (slug) WHERE deleted_at IS NULL`
  - `idx_products_slug_active ON products (slug) WHERE deleted_at IS NULL`
  - `idx_lists_share_slug_active ON lists (share_slug) WHERE deleted_at IS NULL`
  - `idx_user_suppliers_unique_active ON user_suppliers (user_id, supplier_id) WHERE deleted_at IS NULL`

#### ✅ Critérios de Aceitação

- [ ] Todas as 11 tabelas possuem coluna `deleted_at` com valor default `NULL`.
- [ ] Inserir um registro, preencher seu `deleted_at` e reinserir com o mesmo e-mail/slug funciona perfeitamente sem violação de unicidade.
- [ ] Não existem restrições `ON DELETE CASCADE` físico que possam apagar dados históricos inadvertidamente.

---

### [US-DB-03] Validação de Idempotência do Runner de Migrações no Docker

**Como** Desenvolvedor de Infraestrutura,  
**Quero** validar o executor de migrações (`packages/database/src/migrate.ts`) no container Docker,  
**Para que** a inicialização da stack aplique todas as alterações pendentes de forma segura, atômica e resiliente.

#### 📖 Contexto e Regras de Negócio

O serviço `migration` no `docker-compose.yml` executa como um runner one-shot assim que o container `postgres` passa no healthcheck. Ele precisa criar a tabela `_migrations` (se não existir), escanear os arquivos `.sql` em ordem léxica, aplicar cada arquivo em uma transação (`BEGIN/COMMIT`) e registrar o hash/nome da migração concluída.

#### 🗄️ Especificação de Banco de Dados e Script

- Testar a conexão do driver nativo do Bun (`SQL`) utilizando a variável `DATABASE_URL`.
- Simular execução com banco zerado e com migrações pré-existentes.
- Validar se o container finaliza com código de saída `0` e não trava os demais containers dependentes (`backend`, `nginx`).

#### ✅ Critérios de Aceitação

- [ ] O comando `docker compose run --rm migration` executa e aplica todas as migrações ordenadas (`001`, `002`, `003`).
- [ ] A tabela `_migrations` registra com sucesso cada arquivo executado com seu respectivo timestamp.
- [ ] Uma segunda execução consecutiva reconhece que não há migrações pendentes e encerra sem erros em milissegundos.

---

# 📌 FASE 1: Apresentação - Parcial 1 (10,0 pontos)

---

## Autenticação e Sessão (2,5 pts)

---

### [US-BE-01] Utilitários de Criptografia de Senha com Argon2id e Assinatura/Verificação JWT

**Como** Desenvolvedor Backend,  
**Quero** implementar módulos utilitários em TypeScript para hash seguro de senhas e geração/validação de tokens JWT,  
**Para que** a aplicação manipule credenciais e sessões com alto nível de segurança e performance nativa.

#### 📖 Contexto e Regras de Negócio

O RNF03 do PRD exige que todas as senhas de usuários sejam criptografadas com hash seguro antes de persistirem no banco. No runtime do Bun, utilizamos as APIs nativas de alta performance `Bun.password.hash(senha, "argon2id")` e `Bun.password.verify(...)`. Para a sessão, adotamos JWT no padrão HMAC-SHA256 contendo `sub` (user_id), `email`, `role` e tempo de expiração (`exp`, padrão 7 dias).

#### ⚙️ Especificação Técnica (`apps/backend/src/utils/auth.ts`)

- Função `hashPassword(password: string): Promise<string>` utilizando `Bun.password.hash`.
- Função `verifyPassword(password: string, hash: string): Promise<boolean>` utilizando `Bun.password.verify`.
- Função `generateToken(payload: { id: string; email: string; role: number }): Promise<string>`.
- Função `verifyToken(token: string): Promise<{ id: string; email: string; role: number } | null>`.
- Chave secreta obtida da variável `JWT_SECRET` (com fallback seguro para desenvolvimento).

#### ✅ Critérios de Aceitação

- [x] Senhas com mais de 8 caracteres são criptografadas em hash Argon2id válido.
- [x] O utilitário rejeita senhas inválidas na verificação de hash.
- [x] Tokens JWT gerados contêm claims semânticas e validam assinatura corretamente.
- [x] Tokens expirados ou adulterados retornam `null` na validação sem lançar unhandled exceptions.

---

### [US-BE-02] Middleware de Autenticação JWT Bearer

**Como** Desenvolvedor Backend,  
**Quero** criar um middleware interceptor de autenticação no `Bun.serve`,  
**Para que** requisições direcionadas a rotas privadas sejam validadas e o usuário autenticado seja injetado no contexto.

#### 📖 Contexto e Regras de Negócio

Rotas de perfil, clientes, fornecedores e listas exigem identificação do usuário requisitante. O middleware deve inspecionar o header HTTP `Authorization`. Se presente no formato `Bearer <token>`, o token é validado. Se ausente ou inválido em rotas protegidas, a resposta imediata deve ser `401 Unauthorized` com payload JSON padronizado `{ "error": "Unauthorized", "message": "Token de autenticação ausente ou inválido." }`.

#### ⚙️ Especificação Técnica (`apps/backend/src/middlewares/auth.ts`)

- Extração de token do header `req.headers.get("Authorization")`.
- Verificação via utilitário `verifyToken`.
- Anexação dos dados do usuário (`id`, `email`, `role`) ao objeto de requisição ou contexto de execução.
- Suporte a rotas públicas (onde o token é opcional, mas se fornecido enriquece o contexto).

#### ✅ Critérios de Aceitação

- [x] Requisição com token válido prossegue normalmente para o handler da rota com contexto preenchido.
- [x] Requisição sem token em rota protegida recebe HTTP `401 Unauthorized`.
- [x] Requisição com token inválido ou corrompido recebe HTTP `401 Unauthorized`.

---

### [US-BE-03] Rotas REST de Autenticação (POST /login, POST /register, GET /me)

**Como** Usuário do portal (Cliente, Vendedor ou Admin),  
**Quero** me autenticar por e-mail e senha, consultar meus dados e permitir o autocadastro de clientes,  
**Para que** eu possa acessar minhas permissões e gerenciar minhas informações no sistema.

#### 📖 Contexto e Regras de Negócio

Atende aos requisitos **RF01** e **RF07**. O login confere e-mail e senha e retorna o token JWT e dados do perfil. O autocadastro é público e cria sempre um usuário com `role = 1` (Cliente), inserindo atomicamente o registro de credenciais em `users` e os dados cadastrais em `clients`. A rota `/api/auth/me` retorna os dados do usuário conectado para restauração do estado após recarregamento da página.

#### ⚙️ Especificação Técnica (`apps/backend/src/routes/auth.ts`)

- `POST /api/auth/login`:
  - Payload: `{ "email": "string", "password": "string" }`.
  - Retorno 200: `{ "token": "...", "user": { "id": "...", "email": "...", "role": 1, "fullName": "..." } }`.
  - Retorno 400: Campos obrigatórios ausentes.
  - Retorno 401: Credenciais incorretas ou usuário inativo (`deleted_at IS NOT NULL`).
- `POST /api/auth/register`:
  - Payload: `{ "fullName": "string", "email": "string", "phone": "string", "password": "string" }`.
  - Regra: Verifica se o e-mail já existe ativo (`SELECT 1 FROM users WHERE email = :email AND deleted_at IS NULL`). Retorna `409 Conflict` se duplicado.
  - Inserção transacional no PostgreSQL em `users` e `clients`.
  - Retorno 201: Usuário criado com sucesso e token JWT inicializado.
- `GET /api/auth/me`:
  - Rota protegida por autenticação Bearer.
  - Retorno 200: Dados atualizados do usuário e perfil cadastral.

#### ✅ Critérios de Aceitação

- [x] Login com credenciais válidas retorna status HTTP 200 e token JWT assinado.
- [x] Autocadastro persiste dados corretamente em `users` e `clients` em transação SQL segura.
- [x] Tentativa de cadastro com e-mail já existente é rejeitada com status HTTP 409.
- [x] Rota `/api/auth/me` recupera os dados corretos com base no token fornecido.

---

### [US-FE-01] Store Pinia de Autenticação e Interceptor Axios para Bearer Token

**Como** Desenvolvedor Frontend,  
**Quero** centralizar o gerenciamento de autenticação no Pinia e configurar o Axios para anexar o token automaticamente,  
**Para que** todo o frontend Vue 3 consuma a API de forma autenticada e reativa.

#### 📖 Contexto e Regras de Negócio

O estado de autenticação deve ser persistente entre abas e recarregamentos (`localStorage`). O Axios configurado em `src/plugins/axios.ts` deve incluir automaticamente o cabeçalho `Authorization: Bearer <token>` em todas as requisições se houver sessão ativa. Em caso de resposta HTTP 401 do backend, o interceptor deve limpar o token e redirecionar o usuário para a tela de login.

#### 🎨 Especificação Técnica (`apps/web/src/stores/auth.ts` e `src/plugins/axios.ts`)

- Criar store `useAuthStore`:
  - Estado: `user: UserProfile | null`, `token: string | null`, `loading: boolean`, `error: string | null`.
  - Getters: `isAuthenticated: boolean`, `isAdmin: boolean`, `isVendedor: boolean`, `isCliente: boolean`.
  - Actions: `login(email, password)`, `register(dados)`, `fetchCurrentUser()`, `logout()`.
- Atualizar `src/plugins/axios.ts`:
  - Interceptor de requisição: injeta `Bearer ${token}`.
  - Interceptor de resposta: captura `error.response?.status === 401` e invoca `authStore.logout()`.

#### ✅ Critérios de Aceitação

- [ ] O token JWT é armazenado com sucesso no `localStorage` após login bem-sucedido.
- [ ] Requisições disparadas pelo Axios incluem automaticamente o header `Authorization`.
- [ ] Ao clicar em Logout, a store e o `localStorage` são limpos instantaneamente.
- [ ] Erros 401 desconectam o usuário e redirecionam para a rota `/login`.

---

### [US-FE-02] Telas de Login e Autocadastro de Clientes com Design Figma

**Como** Consumidor ou Administrador,  
**Quero** acessar telas intuitivas e elegantes para realizar login ou criar minha conta,  
**Para que** eu possa interagir com o portal da Empório Henz de forma simples em qualquer dispositivo.

#### 📖 Contexto e Regras de Negócio

As interfaces de login e registro devem seguir a estética refinada do Empório Henz, com tipografia limpa, tons terrosos, dourados e neutros de pedra/madeira, e feedback visual em tempo real (carregamento nos botões, avisos claros de erro de validação).

#### 🎨 Especificação Técnica (`apps/web/src/views/auth/`)

- `LoginView.vue`:
  - Formulário com campo de e-mail (validação de formato) e senha (com botão de alternar visualização).
  - Botão de submissão com estado de loading ("Entrando...").
  - Mensagem de alerta visual para credenciais inválidas.
  - Link destacado para "Ainda não tem conta? Cadastre-se".
- `RegisterView.vue`:
  - Formulário com Nome Completo, E-mail, Telefone/WhatsApp (com máscara dinâmica `(99) 99999-9999`) e Senha (mínimo de 8 caracteres).
  - Confirmação de senha com validação reativa.
  - Feedback de sucesso redirecionando diretamente para a experiência autenticada.

#### ✅ Critérios de Aceitação

- [ ] Formulário de login valida campos obrigatórios e exibe mensagens de erro claras da API.
- [ ] Formulário de cadastro valida formato de e-mail, máscara de telefone e tamanho mínimo de senha.
- [ ] Layout perfeitamente responsivo (otimizado para smartphones, tablets e desktop).
- [ ] Redirecionamento automático após autenticação com sucesso.

---

## CRUD 1: Clientes e Pessoas (1,5 pts)

---

### [US-BE-04] Endpoints REST do CRUD de Clientes com Soft Delete

**Como** Administrador do sistema,  
**Quero** uma API REST completa para consultar, criar, atualizar e inativar clientes no PostgreSQL,  
**Para que** a equipe da loja mantenha a base cadastral de pessoas organizada e auditada historicamente.

#### 📖 Contexto e Regras de Negócio

Atende ao **RF01** e **RNF08**. A exclusão de um cliente nunca executa `DELETE` físico. O endpoint `DELETE /api/clientes/:id` preenche `deleted_at = CURRENT_TIMESTAMP` tanto no registro de `clients` quanto no registro vinculado em `users`. Consultas públicas e listagens ativas aplicam obrigatoriamente `WHERE clients.deleted_at IS NULL`.

#### ⚙️ Especificação Técnica (`apps/backend/src/routes/clientes.ts`)

- `GET /api/clientes`:
  - Query params: `search` (busca parcial em nome ou e-mail), `page` (default: 1), `limit` (default: 15).
  - Query SQL: `SELECT c.id, c.user_id, c.full_name, c.phone, u.email, u.role, c.created_at FROM clients c JOIN users u ON u.id = c.user_id WHERE c.deleted_at IS NULL ORDER BY c.created_at DESC`.
  - Retorno 200: `{ "items": [...], "total": N, "page": 1, "limit": 15 }`.
- `GET /api/clientes/:id`:
  - Retorno 200 com os dados detalhados ou 404 Not Found caso inexistente ou já deletado.
- `POST /api/clientes`:
  - Criação administrativa manual de clientes com senha padrão temporária.
- `PUT /api/clientes/:id`:
  - Atualização dos dados cadastrais (`full_name`, `phone`).
- `DELETE /api/clientes/:id`:
  - Soft delete transacional preenchendo `deleted_at = CURRENT_TIMESTAMP` em `clients` e `users`.
  - Retorno 200: `{ "success": true, "message": "Cliente desativado com sucesso." }`.

#### ✅ Critérios de Aceitação

- [x] A listagem filtra registros inativos (`deleted_at IS NOT NULL`) automaticamente.
- [x] A busca textual por nome ou e-mail responde de forma rápida e precisa.
- [x] A exclusão preenche `deleted_at` no banco sem disparar `DELETE` SQL físico.
- [x] A rota `GET /api/clientes/:id` retorna HTTP 404 para registros marcados com soft delete.

---

### [US-FE-03] Interface de Gestão e Listagem de Clientes no Painel Administrativo

**Como** Administrador do sistema,  
**Quero** gerenciar a lista de clientes em uma tela administrativa completa,  
**Para que** eu possa visualizar perfis, buscar por nome/e-mail, editar contatos e inativar contas com facilidade.

#### 📖 Contexto e Regras de Negócio

Tela restrita ao perfil Administrador. Deve oferecer uma tabela responsiva com paginação, campo de busca em tempo real com debounce, modal para edição de nome e telefone, e modal de confirmação para exclusão lógica (com aviso de que a conta será desativada).

#### 🎨 Especificação Técnica (`apps/web/src/views/admin/ClientesView.vue` e `src/api/clientes.ts`)

- Módulo `src/api/clientes.ts`: métodos `listar`, `buscarPorId`, `insert`, `atualizar`, `deletar`.
- Componente `ClientesView.vue`:
  - Tabela com colunas: Nome Completo, E-mail, Telefone/WhatsApp, Papel, Data de Cadastro e Ações.
  - Barra de ferramentas com input de busca em tempo real.
  - Modal de edição reativo com validação de campos.
  - Diálogo de confirmação de exclusão com botão de perigo e feedback via toast.

#### ✅ Critérios de Aceitação

- [ ] Tabela lista os clientes cadastrados com dados em tempo real vindos do backend.
- [ ] Campo de pesquisa filtra a listagem por nome ou e-mail sem recarregar a página.
- [ ] Edição de dados atualiza o registro na tabela e no PostgreSQL.
- [ ] Ação de excluir dispara o soft delete e remove o item da listagem ativa com feedback de sucesso.

---

## CRUD 2: Fornecedores e Marcas Parceiras (1,5 pts)

---

### [US-BE-05] Endpoints REST do CRUD de Fornecedores com Soft Delete

**Como** Administrador da Empório Henz,  
**Quero** uma API REST completa para cadastrar, listar, atualizar e desativar marcas parceiras e fornecedores,  
**Para que** o mostruário digital categorize adequadamente as linhas de fabricação parceiras.

#### 📖 Contexto e Regras de Negócio

Atende aos requisitos **RF04**, **RF18** e **RNF08**. Apenas o Administrador pode criar, editar ou desativar fornecedores. A exclusão é estritamente lógica via preenchimento de `deleted_at = CURRENT_TIMESTAMP` na tabela `suppliers`. Fornecedores desativados deixam de aparecer nas opções ativas de seleção.

#### ⚙️ Especificação Técnica (`apps/backend/src/routes/fornecedores.ts`)

- `GET /api/fornecedores`:
  - Query SQL: `SELECT id, name, contact, active, created_at FROM suppliers WHERE deleted_at IS NULL ORDER BY name ASC`.
  - Retorno 200: Array com todos os fornecedores ativos.
- `GET /api/fornecedores/:id`:
  - Retorno 200 ou 404 se não encontrado.
- `POST /api/fornecedores`:
  - Payload: `{ "name": "string", "contact": "string", "active": boolean }`.
  - Validação: `name` obrigatório (mínimo 3 caracteres).
  - Retorno 201 com o registro persistido.
- `PUT /api/fornecedores/:id`:
  - Atualização dos dados cadastrais do fabricante.
- `DELETE /api/fornecedores/:id`:
  - `UPDATE suppliers SET deleted_at = CURRENT_TIMESTAMP WHERE id = :id`.
  - Retorno 200: `{ "success": true, "message": "Fornecedor inativado com sucesso." }`.

#### ✅ Critérios de Aceitação

- [x] Endpoints respondem com status HTTP semânticos (200, 201, 400, 404).
- [x] Criação persiste o fornecedor no PostgreSQL com `active = TRUE` e `deleted_at = NULL`.
- [x] A exclusão atualiza `deleted_at` com timestamp atual e preserva o histórico no banco.
- [x] A listagem `GET /api/fornecedores` omite registros com `deleted_at IS NOT NULL`.

---

### [US-FE-04] Interface de Gestão de Fornecedores e Marcas Parceiras no Painel

**Como** Administrador da Empório Henz,  
**Quero** uma interface visual para cadastrar e gerenciar as marcas parceiras e fábricas de móveis,  
**Para que** eu controle quais marcas estão disponíveis para categorização de produtos.

#### 📖 Contexto e Regras de Negócio

Tela no painel administrativo permitindo visualizar cartões ou listagem das empresas parceiras (ex.: Primavera Móveis, Estofados Sul, etc.), cadastrar novas fábricas com dados de contato e inativar marcas descontinuadas.

#### 🎨 Especificação Técnica (`apps/web/src/views/admin/FornecedoresView.vue` e `src/api/fornecedores.ts`)

- Módulo `src/api/fornecedores.ts`: métodos `listar`, `buscarPorId`, `insert`, `atualizar`, `deletar`.
- Componente `FornecedoresView.vue`:
  - Cabeçalho com botão destacado "+ Novo Fornecedor".
  - Tabela com Nome da Marca, Contato/Representante, Status (Ativo/Inativo) e Botões de Ação.
  - Modal de cadastro e edição com validação de formulário.
  - Feedback visual com toast notification para operações realizadas.

#### ✅ Critérios de Aceitação

- [ ] Listagem de fornecedores carrega os dados reais persistidos no banco PostgreSQL.
- [ ] Cadastro de novo fornecedor adiciona a linha imediatamente à tabela após salvar.
- [ ] Edição reflete as alterações sem erros.
- [ ] Desativação do fornecedor aciona a confirmação visual e atualiza a interface.

---

## Site Minimamente Funcional com Design Figma (2,0 pts)

---

### [US-FE-05] Layout Base Responsivo, Navbar com Sessão e Identidade Visual do Figma

**Como** Visitante ou Cliente do site,  
**Quero** navegar por um layout harmonioso, com cabeçalho que identifique minha sessão e identidade visual inspirada no Figma,  
**Para que** eu tenha uma experiência fluida, agradável e sofisticada em qualquer dispositivo.

#### 📖 Contexto e Regras de Negócio

O RNF05 exige fidelidade aos padrões de design da Empório Henz. A identidade visual valoriza elementos que remetem ao mobiliário nobre: paleta em tons terrosos, madeira de carvalho (`amber-900`, `stone-800`), acabamentos em linho e pedra. O cabeçalho deve exibir a marca da loja, atalhos de navegação, badge de usuário conectado (com nome e papel) e botão de alternância entre modo cliente e painel administrativo.

#### 🎨 Especificação Técnica (`apps/web/src/components/layout/` e `src/views/HomeView.vue`)

- Componente `AppNavbar.vue`:
  - Logotipo e nome da Empório Henz.
  - Links de navegação: "Catálogo", "História", "Minhas Listas".
  - Área de usuário: se deslogado, exibe botões "Entrar" e "Cadastrar"; se autenticado, exibe avatar/nome, menu dropdown com "Meu Perfil", "Painel Administrativo" (se Admin/Vendedor) e "Sair".
- Componente `AppFooter.vue`:
  - Informações institucionais, endereço em Cruzeiro do Sul, horário de atendimento e links para WhatsApp e Instagram.
- Atualização da `HomeView.vue`:
  - Hero banner elegante destacando a tradição familiar de 50 anos pós-reconstrução.
  - Seções em destaque com cards sofisticados e chamadas para ação.

#### ✅ Critérios de Aceitação

- [ ] Cabeçalho reativo adapta os botões de acordo com o estado logado/deslogado.
- [ ] Layout 100% responsivo com menu mobile em tela cheia/gaveta em smartphones.
- [ ] Paleta visual consistente com Tailwind CSS v4 sem quebras de layout.
- [ ] Navegação entre rotas fluida com Vue Router sem recarregamento de página.

---

## README com Passo a Passo (0,5 pts)

---

### [US-DOC-01] Guia Completo de Execução do Projeto no README (Local e Docker)

**Como** Avaliador da disciplina ou novo desenvolvedor do time,  
**Quero** um guia detalhado no README da raiz explicando todos os pré-requisitos, variáveis de ambiente e comandos de execução,  
**Para que** eu consiga rodar o projeto do zero tanto localmente com Bun quanto em containers Docker sem qualquer dificuldade.

#### 📖 Contexto e Regras de Negócio

Documento fundamental para avaliação técnica. Deve conter instruções claras, testadas e sem ambiguidades, cobrindo o setup com Docker Compose e o setup híbrido de desenvolvimento.

#### 🚀 Especificação de Documentação (`README.md`)

- Seção de Pré-requisitos (Bun 1.4+, Docker Engine e Docker Compose).
- Inicialização rápida com Docker (passo a passo para `.env`, `docker compose up -d --build` e verificação em `http://localhost`).
- Inicialização para desenvolvimento local (`bun install`, migrações com `bun run migrate`, backend na porta 3001 e frontend na porta 3000).
- Credenciais padrão documentadas (`admin@gmail.com` / `admin123`).
- Comandos de qualidade: `bun run check-types`, `bun run lint` e `bun run build`.

#### ✅ Critérios de Aceitação

- [ ] Seguir as instruções do README em um ambiente limpo sobe a aplicação perfeitamente.
- [ ] As credenciais documentadas realizam login com sucesso na primeira tentativa.
- [ ] Todos os comandos listados executam sem erros de sintaxe ou dependências faltantes.

---

## Processo e Robustez (2,0 pts)

---

### [US-ROB-01] Governança OpenSpec, Validação de Tipagem e Linters para Parcial 1

**Como** Engenheiro de Qualidade de Software,  
**Quero** validar o ciclo formal do OpenSpec, a integridade da tipagem estrita do TypeScript e a ausência de erros de linter,  
**Para que** a entrega da Parcial 1 comprove alto padrão de engenharia, processo e robustez técnica.

#### 📖 Contexto e Regras de Negócio

Conforme as regras obrigatórias de governança (`AGENTS.md`), as implementações devem ser formalizadas no OpenSpec. O repositório monorepo deve passar limpo em todos os pipelines de validação de tipos (`vue-tsc` e `tsc`) e linting (`eslint`).

#### ⚙️ Especificação Técnica e Scripts

- Criar proposta formal no OpenSpec em `openspec/changes/parcial-1-auth-cruds/` com `proposal.md`, `specs/` e `tasks.md`.
- Execução de `bun run check-types` na raiz (verificando `apps/web`, `apps/backend` e `packages/database`).
- Execução de `bun run lint` sem erros ou advertências impeditivas.
- Teste de build estático de produção com `bun run build`.

#### ✅ Critérios de Aceitação

- [ ] Proposta formal da Parcial 1 documentada no OpenSpec.
- [ ] `bun run check-types` executa com saída de sucesso em todos os pacotes.
- [ ] `bun run lint` executa sem nenhum erro.
- [ ] `bun run build` gera a pasta `dist` de produção perfeitamente.

---

# 📌 FASE 2: Apresentação - Parcial 2 / Final (10,0 pontos)

---

## Permissões com Dois Papéis (1,5 pts)

---

### [US-BE-06] Middleware RBAC com Bloqueio Estrito 403 Forbidden

**Como** Administrador do Sistema,  
**Quero** que o backend Bun valide rigorosamente o papel de cada usuário em cada rota protegida,  
**Para que** clientes e vendedores não consigam executar ações além de suas permissões, retornando HTTP 403 Forbidden padronizado.

#### 📖 Contexto e Regras de Negócio

Atende ao **RNF09** e **RF19**. Segurança no servidor é mandatória e nunca depende da ocultação visual de botões na UI.

- Papel `role = 3` (Administrador): Acesso global irrestrito a todos os endpoints.
- Papel `role = 2` (Vendedor): Não pode criar, alterar ou desativar fornecedores (`403 Forbidden`). Não pode gerenciar produtos de fornecedores aos quais não está vinculado (`403 Forbidden`).
- Papel `role = 1` (Cliente): Acesso bloqueado a qualquer rota administrativa (`403 Forbidden`).
- Payload de erro padronizado: `{ "error": "Forbidden", "message": "Você não possui permissão para executar esta ação." }`.

#### ⚙️ Especificação Técnica (`apps/backend/src/middlewares/rbac.ts`)

- Função `requireRole(...allowedRoles: number[])`.
- Validação do `req.user.role`.
- Resposta imediata `403 Forbidden` com headers JSON padronizados se o papel do usuário não constar na lista autorizada.

#### ✅ Critérios de Aceitação

- [x] Requisições de Cliente tentando acessar rotas administrativas recebem invariavelmente HTTP 403.
- [x] Requisições de Vendedor tentando cadastrar ou alterar fornecedor recebem HTTP 403.
- [x] Administrador acessa todas as rotas com sucesso (HTTP 200/201).

---

### [US-BE-07] Endpoints de Vínculos Multi-Empresa para Vendedores (user_suppliers)

**Como** Administrador do Sistema,  
**Quero** gerenciar quais vendedores representam quais empresas parceiras através de endpoints dedicados,  
**Para que** o catálogo de produtos opere com governança multi-empresa isolada e segura.

#### 📖 Contexto e Regras de Negócio

Atende aos requisitos **RF15**, **RF16** e **RF17**. Um vendedor pode representar 1 ou N marcas simultaneamente. A tabela `user_suppliers` registra essa relação N:N. Apenas o Administrador pode criar ou revogar vínculos. A remoção de vínculo aplica soft delete (`deleted_at = CURRENT_TIMESTAMP`).

#### ⚙️ Especificação Técnica (`apps/backend/src/routes/vendedores.ts`)

- `GET /api/vendedores`: Lista todos os usuários com `role = 2` ativos.
- `GET /api/vendedores/:id/fornecedores`: Lista os fornecedores vinculados ativamente ao vendedor.
- `POST /api/vendedores/:id/fornecedores`: Atribui vínculo (`user_id`, `supplier_id`) em `user_suppliers`.
- `DELETE /api/vendedores/:id/fornecedores/:supplierId`: Preenche `deleted_at = CURRENT_TIMESTAMP` no vínculo.

#### ✅ Critérios de Aceitação

- [x] Apenas o Administrador consegue invocar as rotas de vínculo (outros recebem 403).
- [x] O vínculo N:N persiste corretamente na tabela `user_suppliers`.
- [x] A desvinculação executa soft delete e reflete imediatamente nas validações de permissão do vendedor.

---

### [US-FE-06] Interface Administrativa de Gestão de Vínculos de Vendedores

**Como** Administrador do Sistema,  
**Quero** uma tela no painel para selecionar um vendedor e marcar as empresas parceiras que ele está autorizado a representar,  
**Para que** a governança de equipe seja visual, rápida e transparente.

#### 📖 Contexto e Regras de Negócio

Tela no painel administrativo listando a equipe de vendedores. Ao selecionar um vendedor, exibe caixas de seleção com todos os fornecedores ativos cadastrados, indicando quais já estão vinculados e permitindo salvar novas atribuições.

#### 🎨 Especificação Técnica (`apps/web/src/views/admin/VendedoresVinculosView.vue`)

- Listagem dos colaboradores com papel de Vendedor.
- Painel lateral ou modal exibindo checklist das empresas parceiras.
- Ações para vincular/desvincular fornecedores com feedback reativo imediato.

#### ✅ Critérios de Aceitação

- [ ] Exibe com clareza quais marcas cada vendedor está autorizado a operar.
- [ ] Salvar vínculos chama as APIs correspondentes e atualiza o estado visual sem recarregar a página.
- [ ] Interface restrita ao perfil Administrador.

---

## CRUD 3: Categorias e Subtipos (0,5 pts)

---

### [US-BE-08] Endpoints REST do CRUD de Categorias e Subtipos com Soft Delete

**Como** Administrador do Sistema,  
**Quero** endpoints REST para cadastrar e organizar categorias principais (ambientes) e subtipos vinculados,  
**Para que** o catálogo de móveis seja classificado em categorias navegáveis no site.

#### 📖 Contexto e Regras de Negócio

Atende ao **RF04**. Categorias principais representam ambientes da casa (Sala de Estar, Jantar, Quarto, Cozinha, Escritório). Subtipos representam a tipologia do móvel (Sofá, Mesa de Jantar, Cama Casal, Roupeiro), obrigatoriamente vinculados a uma categoria via `category_id`. Ambas adotam soft delete (`deleted_at`).

#### ⚙️ Especificação Técnica (`apps/backend/src/routes/categorias.ts`)

- `GET /api/categorias`: Retorna categorias ativas com seus respectivos subtipos aninhados.
- `POST /api/categorias`: Cria categoria principal (`name`, `slug`).
- `PUT /api/categorias/:id`: Atualiza categoria.
- `DELETE /api/categorias/:id`: Soft delete da categoria e cascata lógica de seus subtipos.
- `POST /api/subtipos`: Cria subtipo vinculado a uma `category_id`.
- `DELETE /api/subtipos/:id`: Soft delete do subtipo.

#### ✅ Critérios de Aceitação

- [ ] `GET /api/categorias` traz a hierarquia de categorias e subtipos em estrutura JSON limpa.
- [ ] Slugs são gerados ou validados com unicidade ativa.
- [ ] Exclusão de categoria ou subtipo preenche `deleted_at` sem apagar linhas fisicamente.

---

### [US-FE-07] Interface Administrativa de Categorias e Subtipos no Painel

**Como** Administrador da Empório Henz,  
**Quero** gerenciar visualmente os ambientes e tipologias de móveis na área administrativa,  
**Para que** o catálogo público mantenha um menu organizado para os clientes.

#### 📖 Contexto e Regras de Negócio

Interface administrativa intuitiva com visualização em acordeão ou árvore hierárquica, permitindo adicionar novos ambientes e cadastrar subtipos vinculados.

#### 🎨 Especificação Técnica (`apps/web/src/views/admin/CategoriasView.vue` e `src/api/categorias.ts`)

- Tabela ou lista em acordeão das categorias.
- Sublistagem dos subtipos vinculados a cada ambiente.
- Modais para cadastro e edição rápida de categorias e subtipos.
- Ação de exclusão lógica com confirmação visual.

#### ✅ Critérios de Aceitação

- [ ] Permite cadastrar um novo ambiente (ex: "Área Gourmet") e adicionar subtipos (ex: "Banqueta").
- [ ] Reflete imediatamente as atualizações nas listagens.
- [ ] Bloqueia envio de formulário com campos obrigatórios vazios.

---

## CRUD 4: Produtos, Variações e Fotos (0,5 pts)

---

### [US-BE-09] Endpoints REST do CRUD de Produtos com Escopo por Fornecedor

**Como** Administrador ou Vendedor Vinculado,  
**Quero** cadastrar, editar, listar e desativar produtos com dimensões estruturadas, especificações JSONB e regras de disponibilidade,  
**Para que** o catálogo reflita o mostruário físico e os prazos sob encomenda dos fabricantes.

#### 📖 Contexto e Regras de Negócio

Atende aos requisitos **RF02**, **RF03**, **RF16**, **RF17** e **RF19**.

- Dimensões obrigatórias em milímetros (`height_mm`, `width_mm`, `depth_mm`).
- Disponibilidade: `IN_STOCK` (pronta entrega na loja física) ou `ON_DEMAND` (sob encomenda com prazo estimado em dias `estimated_days`).
- Validação Multi-empresa: Se o usuário logado for Vendedor (`role = 2`), o backend confere se o `supplier_id` do produto pertence às empresas vinculadas ao vendedor em `user_suppliers`. Se não pertencer, retorna `403 Forbidden`.
- Exclusão lógica obrigatória preenchendo `deleted_at = CURRENT_TIMESTAMP`.

#### ⚙️ Especificação Técnica (`apps/backend/src/routes/produtos.ts`)

- `GET /api/produtos`: Listagem administrativa com filtros por status, fornecedor e categoria.
- `GET /api/produtos/:id`: Retorna todos os dados do produto, variações e imagens.
- `POST /api/produtos`: Criação de produto com validação de escopo multi-empresa.
- `PUT /api/produtos/:id`: Atualização de dados cadastrais do produto.
- `DELETE /api/produtos/:id`: Soft delete do produto.

#### ✅ Critérios de Aceitação

- [ ] Vendedor só consegue criar ou editar produtos das empresas às quais está ativamente vinculado.
- [ ] Tentativa de gerenciar produto de outra empresa retorna HTTP `403 Forbidden`.
- [ ] O soft delete marca `deleted_at` e oculta o produto imediatamente das buscas ativas.

---

### [US-BE-10] Upload e Armazenamento Otimizado de Fotos Base64 (Thumbnail vs Full)

**Como** Desenvolvedor Backend,  
**Quero** processar e persistir imagens de produtos em Base64 no PostgreSQL utilizando a estratégia dupla (thumbnail leve vs full completa),  
**Para que** as listagens do catálogo carreguem em milissegundos sem sobrecarregar o tráfego de dados.

#### 📖 Contexto e Regras de Negócio

Atende aos requisitos **RF02** e **RNF02**. As fotos dos produtos são salvas diretamente no banco na tabela `product_images`:

- `thumbnail_base64`: Imagem comprimida e redimensionada (< 50 KB) para cards de catálogo.
- `full_base64`: Imagem completa (< 2 MB) para o carrossel de fotos na página de detalhe.
- Requisições com imagem superior a 2 MB devem ser rejeitadas com HTTP `400 Bad Request`.

#### ⚙️ Especificação Técnica (`apps/backend/src/services/imageService.ts`)

- Validação do tamanho do payload Base64 antes de salvar.
- Associação opcional da foto com `variation_id` (para troca de imagem na seleção de acabamento).
- Gravação transacional em `product_images`.

#### ✅ Critérios de Aceitação

- [ ] Imagens maiores que 2 MB são bloqueadas com status HTTP 400 e mensagem informativa.
- [ ] Listagens de catálogo retornam apenas `thumbnail_base64`, mantendo o payload ultraleve.
- [ ] O detalhe do produto recupera o carrossel completo de imagens em alta resolução.

---

### [US-FE-08] Formulário Completo de Produtos com Variações e Fotos Base64

**Como** Administrador ou Vendedor,  
**Quero** uma interface rica de formulário para cadastrar móveis com fotos, dimensões, opções de cores/madeiras e especificações técnicas,  
**Para que** o produto fique perfeitamente descrito e visualmente atraente para os clientes.

#### 📖 Contexto e Regras de Negócio

O formulário deve ser organizado por etapas ou seções lógicas:

1. Dados Básicos (Nome, Categoria, Subtipo, Fornecedor). Se vendedor tiver apenas 1 empresa vinculada, ela é pré-selecionada e travada.
2. Preço de Referência, Condições de Parcelamento e Disponibilidade (Pronta Entrega ou Sob Encomenda com prazo em dias).
3. Dimensões em mm (Altura, Largura, Profundidade).
4. Variações de Acabamento (seletor de cores sólidas ou bicolores com hexadecimais, amostra de textura).
5. Upload de Fotos com pré-visualização instantânea e conversão automática para Base64.
6. Especificações Técnicas flexíveis (chave e valor em JSONB).

#### 🎨 Especificação Técnica (`apps/web/src/views/admin/ProdutoFormView.vue`)

- Componentes de input estilizados com validação reativa.
- Seletor de cores visual com suporte a círculo bicolor.
- Input de arquivo local com conversão direta para string Base64 e validação de tamanho.

#### ✅ Critérios de Aceitação

- [ ] Converte e exibe preview das fotos selecionadas no formulário.
- [ ] Vendedor vinculado a apenas 1 fornecedor tem a empresa pré-selecionada sem possibilidade de alteração.
- [ ] Salva o produto completo na API com feedback de sucesso e redirecionamento.

---

## Catálogo Principal e Detalhes do Produto (2,0 pts)

---

### [US-BE-11] API do Catálogo Público com Filtros Combinados e Busca Textual

**Como** Consumidor ou Arquiteto navegando no site,  
**Quero** consultar o catálogo de móveis com filtros combinados rápidos e busca textual,  
**Para que** eu encontre com facilidade os produtos ideais para mobiliar meus ambientes.

#### 📖 Contexto e Regras de Negócio

Atende aos requisitos **RF05** e **RNF01**. A rota pública `GET /api/catalogo` deve responder em menos de 2 segundos, filtrando estritamente itens ativos (`active = TRUE AND deleted_at IS NULL`). Suporta múltiplos filtros combinados:

- Categoria e Subtipo.
- Disponibilidade: `IN_STOCK` (pronta entrega) ou `ON_DEMAND` (encomenda).
- Faixa de preço (`min_price` e `max_price`).
- Fornecedor / Marca.
- Busca textual livre por nome ou descrição.

#### ⚙️ Especificação Técnica (`apps/backend/src/routes/catalogo.ts`)

- Query SQL dinâmica com parâmetros preparados seguros.
- Retorno de miniaturas (`thumbnail_base64`) e resumo de variações disponíveis.
- Paginação otimizada com contagem de total de itens.

#### ✅ Critérios de Aceitação

- [ ] Retorna os produtos corretos na combinação de filtros (ex: Sala de Estar + Pronta Entrega).
- [ ] Produtos desativados via soft delete nunca são retornados na busca pública.
- [ ] Tempo de resposta inferior a 2 segundos com carga de produtos.

---

### [US-FE-09] Tela de Catálogo Público com Sidebar de Filtros e Grid Responsivo

**Como** Consumidora navegando na loja online,  
**Quero** uma página de catálogo bonita com barra lateral de filtros interativos e cards claros de produtos,  
**Para que** eu possa explorar o mostruário de móveis de forma agradável no celular ou computador.

#### 📖 Contexto e Regras de Negócio

Apresenta o catálogo público da Empório Henz conforme o layout do Figma. Possui sidebar lateral no desktop e botão de filtros em gaveta no mobile. Cada card de produto exibe foto principal nítida, selo de pronta entrega ou prazo em dias, preço de referência, acabamentos disponíveis e botão para ver detalhes.

#### 🎨 Especificação Técnica (`apps/web/src/views/CatalogoView.vue`)

- Componente de barra lateral com checkboxes de categorias, opções de disponibilidade e slider de preço.
- Grid de cards responsivo (1 coluna mobile, 2 tablet, 3-4 desktop).
- Estado de loading (skeletons elegantes) e tela amigável para busca sem resultados.

#### ✅ Critérios de Aceitação

- [ ] A alteração de filtros atualiza a listagem de produtos dinamicamente.
- [ ] Cards destacam com clareza a disponibilidade (Pronta Entrega na Loja ou Sob Encomenda).
- [ ] Clique no card redireciona para a página de detalhe do produto selecionado.

---

### [US-BE-12] Endpoint de Detalhes do Produto e Especificações Técnicas JSONB

**Como** Consumidor ou Vendedor no Showroom,  
**Quero** consultar todos os dados completos de um produto específico via API,  
**Para que** eu tenha acesso ao carrossel de alta resolução, variações de acabamento e ficha técnica completa.

#### 📖 Contexto e Regras de Negócio

Atende ao **RF06**. A rota `GET /api/catalogo/:id` ou `:slug` retorna a entidade completa do produto, incluindo carrossel completo de fotos em alta resolução (`full_base64`), lista de variações de acabamento com amostras e a tabela técnica em `specifications JSONB`.

#### ⚙️ Especificação Técnica

- Query agregada com joins em `product_images`, `product_variations`, `categories` e `suppliers`.
- Retorno 200 com objeto rico estruturado ou 404 se inexistente ou excluído logicamente.

#### ✅ Critérios de Aceitação

- [ ] Retorna todas as fotos do carrossel na ordem correta (`sort_order`).
- [ ] Retorna o array de cores e amostras de tecido de cada variação.
- [ ] Retorna especificações técnicas estruturadas prontas para renderização em tabela.

---

### [US-FE-10] Página de Detalhe do Produto com Carrossel e Convite ao Showroom

**Como** Consumidora final que tem receio de comprar móveis sem ver o material,  
**Quero** ver fotos grandes do produto, alternar acabamentos, ler sobre a política de entrega/montagem e ver o convite oficial para visitar o showroom físico em Cruzeiro do Sul,  
**Para que** eu me sinta 100% segura com relação à qualidade dos móveis antes de comprar.

#### 📖 Contexto e Regras de Negócio

Atende ao **RF06**. Elementos obrigatórios na tela:

1. Galeria de fotos interativa com miniaturas e imagem principal com zoom.
2. Seletor de variações de acabamento: ao clicar em uma cor/tecido, a foto principal do carrossel atualiza para o acabamento correspondente (se vinculado).
3. Dimensões formatadas (Altura x Largura x Profundidade) e tabela de ficha técnica estruturada.
4. Política regional de entrega e montagem profissional da Empório Henz na região dos Vales.
5. **Card de Convite Oficial**: Convidando o cliente a visitar a loja física em Cruzeiro do Sul para ver e tocar nas amostras reais de tecidos e madeiras.
6. Botão para Salvar em Lista e Botão "Comprar pelo WhatsApp".

#### 🎨 Especificação Técnica (`apps/web/src/views/ProdutoDetalheView.vue`)

- Carrossel de imagens com suporte a toque/swipe em telas mobile.
- Seletores de cor com hexadecimais estilizados.
- Renderizador dinâmico da tabela técnica a partir do JSONB.

#### ✅ Critérios de Aceitação

- [ ] Selecionar acabamento altera a imagem principal correspondente no carrossel.
- [ ] Exibe claramente as especificações, dimensões e condições de entrega/montagem.
- [ ] Card de visita ao showroom em Cruzeiro do Sul está presente e visualmente destacado.

---

## 3 Testes Automatizados com bun:test (2,5 pts)

---

### [US-TEST-01] Teste Automatizado 1: Matriz de Autorização RBAC e Bloqueio 403 (RNF09)

**Como** Engenheiro de Software e Avaliador,  
**Quero** testes automatizados validando o barramento estrito da matriz de autorização no backend,  
**Para que** tentativas de acesso não autorizado retornem status HTTP 403 Forbidden comprovado por teste de integração.

#### 📖 Contexto e Regras de Negócio

Atende aos requisitos **RF19** e **RNF09**. Casos de teste obrigatórios:

1. Usuário com papel Cliente tenta enviar requisições de criação ou edição em rotas administrativas -> recebe `403 Forbidden`.
2. Vendedor sem fornecedor vinculado tenta criar produto -> recebe `403 Forbidden`.
3. Vendedor vinculado apenas à Empresa A tenta enviar produto com `supplier_id` da Empresa B -> recebe `403 Forbidden`.
4. Vendedor tenta criar ou editar fornecedor -> recebe `403 Forbidden`.

#### ⚙️ Especificação Técnica (`apps/backend/tests/authorization.test.ts`)

- Utiliza a suíte nativa `bun:test` (`describe`, `test`, `expect`).
- Emite requisições HTTP simuladas contra os endpoints do backend utilizando tokens JWT assinados com diferentes papéis.

#### ✅ Critérios de Aceitação

- [ ] O teste executa via `bun test apps/backend/tests/authorization.test.ts` e passa com 100% de sucesso.
- [ ] Todas as 4 violações de autorização são capturadas e confirmam o recebimento de HTTP 403.

---

### [US-TEST-02] Teste Automatizado 2: Soft Delete Estrito sem Remoção Física (RNF08)

**Como** Engenheiro de Software e Avaliador,  
**Quero** testes automatizados comprovando que a exclusão lógica não remove dados físicos do banco de dados,  
**Para que** a integridade histórica e de auditoria da Empório Henz seja comprovada por código.

#### 📖 Contexto e Regras de Negócio

Atende aos requisitos **RF03** e **RNF08**. O teste deve:

1. Criar um registro no banco PostgreSQL (ex.: um produto de teste).
2. Executar a requisição `DELETE /api/produtos/:id`.
3. Consultar diretamente o banco relacional via SQL e comprovar que a linha continua persistida e que a coluna `deleted_at` contém timestamp não-nulo.
4. Consultar a rota pública `GET /api/catalogo` e comprovar que o produto desativado não é mais listado.

#### ⚙️ Especificação Técnica (`apps/backend/tests/soft_delete.test.ts`)

- Script com `bun:test` executando queries no banco de dados e requisições HTTP na API.

#### ✅ Critérios de Aceitação

- [ ] O teste executa via `bun test apps/backend/tests/soft_delete.test.ts` com sucesso.
- [ ] Comprova formalmente a presença do timestamp no campo `deleted_at` e a ausência do produto na API pública.

---

### [US-TEST-03] Teste Automatizado 3: Privacidade de Listas e Acesso Seguro UUID (RNF04)

**Como** Engenheiro de Software e Avaliador,  
**Quero** testes automatizados validando o isolamento e privacidade das listas dos clientes,  
**Para que** listas particulares de um cliente permaneçam inacessíveis por terceiros, exceto via link público compartilhado.

#### 📖 Contexto e Regras de Negócio

Atende aos requisitos **RF10** e **RNF04**. Cenários de teste:

1. Cliente A autenticado tenta acessar endpoint privado da lista do Cliente B -> recebe `403 Forbidden` ou `404 Not Found`.
2. Visitante anônimo acessa a rota pública com o `share_slug` UUID da lista -> recebe HTTP 200 com os produtos em modo somente-leitura.
3. A resposta do link compartilhado nunca expõe a senha, telefone ou e-mail pessoal do cliente criador.

#### ⚙️ Especificação Técnica (`apps/backend/tests/lists_privacy.test.ts`)

- Teste com `bun:test` simulando múltiplos tokens de clientes e acessos anônimos via UUID.

#### ✅ Critérios de Aceitação

- [ ] O teste executa via `bun test apps/backend/tests/lists_privacy.test.ts` com sucesso.
- [ ] Garante a proteção das listas privadas e a integridade do link público compartilhado.

---

## Site Inteiro Navegável: Listas, WhatsApp e Tablet (2,0 pts)

---

### [US-BE-13] API de Listas de Clientes e Link Público UUID Somente-Leitura

**Como** Cliente ou Arquiteto,  
**Quero** endpoints REST para organizar produtos em pastas e gerar links públicos de compartilhamento,  
**Para que** eu possa salvar opções de móveis e apresentar para meus clientes ou familiares.

#### 📖 Contexto e Regras de Negócio

Atende aos requisitos **RF08**, **RF09** e **RF10**.

- Todo cliente recebe automaticamente no cadastro as 3 listas padrão permanentes (`is_system = TRUE`): **Favoritos**, **Lista de Desejos** e **Lista de Presentes**. As listas padrão não podem ser deletadas.
- O cliente pode criar pastas customizadas ilimitadas (`CUSTOM`).
- Cada lista possui um `share_slug UUID` único gerado automaticamente para compartilhamento público somente-leitura (`GET /api/listas/compartilhadas/:shareSlug`).

#### ⚙️ Especificação Técnica (`apps/backend/src/routes/listas.ts`)

- `GET /api/listas`: Retorna todas as listas do cliente autenticado com quantidade de itens.
- `POST /api/listas`: Cria nova pasta personalizada.
- `POST /api/listas/:id/itens`: Adiciona produto (e acabamento opcional `variation_id`) à lista.
- `DELETE /api/listas/:id/itens/:itemId`: Remove produto da lista.
- `GET /api/listas/compartilhadas/:shareSlug`: Rota pública retornando os itens da lista sem vazar dados sensíveis do proprietário.

#### ✅ Critérios de Aceitação

- [ ] Inicialização correta das 3 listas padrão no primeiro acesso do cliente.
- [ ] Itens associam corretamente o produto e a variação de acabamento escolhida.
- [ ] O link compartilhado via UUID permite visualização sem autenticação em modo somente-leitura.

---

### [US-FE-11] Área "Minhas Listas", Pastas de Projetos e Modal de Salvamento

**Como** Consumidor ou Arquiteto,  
**Quero** gerenciar minhas pastas no site e salvar móveis diretamente do catálogo,  
**Para que** eu organize os ambientes da minha casa ou os projetos dos meus clientes.

#### 📖 Contexto e Regras de Negócio

No card de cada produto e na página de detalhes, o botão "Salvar" abre um modal listando as opções de destino (Favoritos, Desejos, Presentes e pastas personalizadas). Na área "Minhas Listas", o usuário visualiza suas listas em abas, renomeia pastas criadas por ele e obtém o link de compartilhamento com um clique.

#### 🎨 Especificação Técnica (`apps/web/src/views/MinhasListasView.vue` e componentes)

- Modal reutilizável de salvamento de produto em lista.
- Interface em abas com cards dos produtos salvos, fotos e valores.
- Botão "Copiar Link Público" com feedback de texto copiado na área de transferência.

#### ✅ Critérios de Aceitação

- [ ] O usuário consegue salvar qualquer produto em qualquer uma de suas listas.
- [ ] Criação e remoção de pastas personalizadas funciona de forma reativa.
- [ ] A exclusão das listas padrão do sistema é devidamente bloqueada na UI.

---

### [US-FE-12] Integração de Disparo de Compra e Orçamento via WhatsApp

**Como** Cliente interessado em fechar a compra de um produto ou de uma lista inteira,  
**Quero** clicar em um botão de WhatsApp que já abra o aplicativo com a mensagem pronta contendo os dados do móvel,  
**Para que** eu inicie a negociação direta com a equipe da Empório Henz sem precisar digitar tudo manualmente.

#### 📖 Contexto e Regras de Negócio

Atende ao **RF12**.

- No produto individual: botão "Comprar pelo WhatsApp" compõe a mensagem contendo: nome do móvel, acabamento escolhido, preço de referência e link da página.
- Na lista de produtos: botão "Solicitar Orçamento da Lista pelo WhatsApp" compõe a mensagem contendo o nome da lista, relação dos itens e o link público compartilhado.
- Formato do link de redirecionamento: `https://wa.me/{numero_loja}?text={mensagem_codificada}`.

#### 🎨 Especificação Técnica (`apps/web/src/utils/whatsapp.ts`)

- Utilitário formatador de texto e gerador de URL `encodeURIComponent`.
- Botão estilizado com ícone oficial do WhatsApp em verde vibrante e destaque visual.

#### ✅ Critérios de Aceitação

- [ ] O clique abre o WhatsApp Web ou o app no celular com o texto pré-preenchido correto.
- [ ] A mensagem inclui o nome exato do produto, acabamento selecionado, valor e link da página.
- [ ] O envio da lista gera o link público e resume as opções salvas perfeitamente.

---

### [US-BE-14] Consulta de Listas por E-mail para Atendimento na Loja Física

**Como** Vendedor ou Administrador atendendo um cliente no showroom físico em Cruzeiro do Sul,  
**Quero** buscar as listas salvas do cliente digitando apenas o e-mail dele na tela de atendimento,  
**Para que** eu possa guiar o cliente pelo showroom físico e apresentar as amostras reais correspondentes aos produtos que ele pesquisou em casa.

#### 📖 Contexto e Regras de Negócio

Atende aos requisitos **RF11** e **RNF04**. Acesso restrito a Vendedores e Administradores. O atendente solicita o e-mail do cliente, digita no sistema e a API retorna as listas ativas e os produtos favoritados. Caso o e-mail não seja encontrado, a API responde com HTTP 404 amigável `{ "error": "Not Found", "message": "Nenhum cliente cadastrado com este e-mail." }`.

#### ⚙️ Especificação Técnica (`apps/backend/src/routes/atendimento.ts`)

- `GET /api/atendimento/cliente?email=...`:
  - Validação de papel (apenas Vendedor ou Admin).
  - Busca cliente por e-mail e retorna suas listas e itens associados.

#### ✅ Critérios de Aceitação

- [ ] Busca por e-mail válido retorna as listas e variações salvas pelo cliente.
- [ ] Busca por e-mail inexistente retorna HTTP 404 claro.
- [ ] Tentativa de acesso por usuário comum (Cliente) é bloqueada com status 403 Forbidden.

---

### [US-FE-13] Interface de Atendimento Presencial em Tablet para Vendedores

**Como** Vendedor no tablet da loja física,  
**Quero** uma interface rápida de atendimento com campo de busca por e-mail e visualização limpa das listas do cliente,  
**Para que** eu agilize a consultoria presencial e feche vendas no showroom com alto padrão de atendimento.

#### 📖 Contexto e Regras de Negócio

Interface otimizada para tablets (touch-friendly, botões grandes e leitura clara). Permite ao vendedor consultar rapidamente o que o cliente salvou em casa e visualizar as especificações de tecidos e madeiras para buscar as amostras físicas na prateleira da loja.

#### 🎨 Especificação Técnica (`apps/web/src/views/admin/AtendimentoTabletView.vue`)

- Campo de busca centralizado com teclado virtual otimizado.
- Exibição em cards das listas do cliente e fotos dos móveis.
- Resumo visual das cores e materiais escolhidos pelo cliente.

#### ✅ Critérios de Aceitação

- [ ] Interface fluida e responsiva em tablets de atendimento no showroom.
- [ ] Busca em tempo real exibe os produtos e acabamentos salvos pelo cliente.
- [ ] Permite alternar rapidamente entre clientes sem recarregar a aplicação.

---

### [US-BE-15] Algoritmo de Recomendações de Produtos Complementares

**Como** Consumidor navegando no catálogo ou na página de um produto,  
**Quero** ver sugestões de móveis complementares do mesmo ambiente ("Você também pode gostar"),  
**Para que** eu possa compor a decoração completa da minha casa.

#### 📖 Contexto e Regras de Negócio

Atende ao **RF14**. O sistema busca automaticamente até 4 itens ativos da mesma categoria principal (`WHERE category_id = :catId AND id != :prodId AND active = TRUE AND deleted_at IS NULL LIMIT 4`), dispensando necessidade de curadoria manual.

#### ⚙️ Especificação Técnica (`apps/backend/src/routes/produtos.ts`)

- Rota `GET /api/produtos/:id/recomendados`.
- Consulta SQL otimizada com limite de 4 itens.

#### ✅ Critérios de Aceitação

- [ ] Retorna produtos complementares da mesma categoria.
- [ ] Nunca inclui o próprio produto consultado na lista de sugestões.
- [ ] Oculta automaticamente itens deletados logicamente.

---

## Sistema Publicado na VM (1,0 pt)

---

### [US-INFRA-01] Provisionamento, Deploy e Publicação em URL na VM Linux via Docker

**Como** Banca Avaliadora e Usuários Finais,  
**Quero** acessar o sistema Empório Henz através de uma URL pública na internet hospedada em uma Máquina Virtual Linux,  
**Para que** o portal esteja disponível para uso real em produção de qualquer lugar.

#### 📖 Contexto e Regras de Negócio

Apresentação e deploy em ambiente real. Toda a arquitetura foi conteinerizada com Docker Compose (PostgreSQL, Migrations, Backend Bun e Nginx na porta 80). Na VM, o deploy é automatizado através de `git pull` e execução do script `./deploy.sh`.

#### 🚀 Especificação de Infraestrutura e Deploy

- Conectar à VM via SSH.
- Clonar o repositório ou rodar `git pull` na branch principal.
- Configurar variáveis no `.env` da VM.
- Executar `./deploy.sh` (build das imagens, migração automática e subida dos containers).
- Validar acesso público pelo IP ou domínio configurado.

#### ✅ Critérios de Aceitação

- [ ] O sistema responde com sucesso em uma URL ou IP público na porta 80.
- [ ] O Nginx serve os arquivos estáticos do frontend e roteia requisições `/api/*` para o backend Bun.
- [ ] O banco de dados PostgreSQL roda isolado na rede interna sem portas abertas para a internet.

---

## Processo e Robustez Final (2,0 pts)

---

### [US-ROB-02] Validação Final do Monorepo, Testes E2E e Encerramento no OpenSpec

**Como** Arquiteto de Software e Avaliador,  
**Quero** auditar a integridade final do monorepo, executar todos os testes e formalizar o arquivamento das mudanças no OpenSpec,  
**Para que** a entrega final seja aprovada com nota máxima em processo e robustez de engenharia.

#### 📖 Contexto e Regras de Negócio

Verificação final de toda a suíte de testes (`bun test`), compilação sem erros (`bun run build`), ausência de advertências de tipagem (`bun run check-types`) e arquivamento formal das propostas no OpenSpec via `openspec-archive-change`.

#### ⚙️ Especificação Técnica

- Execução de `bun test` com 100% dos testes passando.
- Execução de `bun run check-types` e `bun run lint`.
- Validação de logs e persistência limpa no Docker Compose.
- Arquivamento da proposta da Parcial 2 no OpenSpec.

#### ✅ Critérios de Aceitação

- [ ] Todos os testes automatizados executam e passam com sucesso.
- [ ] Monorepo compila com sucesso em modo de produção.
- [ ] Propostas arquivadas no OpenSpec com histórico documentado.
