# Contrato e Guia de Integração da API — Front-end (V1)

Este documento especifica a documentação oficial de rotas, contratos de dados, formatos de requisição/resposta, cabeçalhos de autenticação e tipagens TypeScript para consumo pelo Front-end (`apps/web`).

---

## 📌 1. Visão Geral e Convenções da API

- **Prefixação Canônica**: Todas as rotas de negócio da API V1 respondem sob o prefixo `/api/v1/`.
- **Base URL em Desenvolvimento**: `http://localhost:3001` (ou `/api/v1/` quando utilizado proxy do Vite).
- **Base URL em Produção**: `/api/v1/` (servido via Nginx proxy reverso na porta 80).
- **Formato de Dados**: Estritamente `application/json` (com cabeçalho `Content-Type: application/json` em todas as requisições com corpo).
- **CORS**: Habilitado para origens locais com suporte a requisições preflight `OPTIONS`.

### 1.1 Autenticação via Bearer Token

As rotas protegidas exigem o envio do token JWT no cabeçalho HTTP:
```http
Authorization: Bearer <seu_token_jwt>
```

### 1.2 Formato Padronizado de Respostas de Erro

Quando uma requisição falha (status 4xx ou 5xx), a API sempre retorna o formato JSON uniforme:

```json
{
  "error": "NomeDoErro",
  "message": "Descrição detalhada e amigável da falha."
}
```

| Código HTTP | Erro | Descrição |
| :--- | :--- | :--- |
| **`400 Bad Request`** | `Bad Request` | Erro de validação nos dados enviados (campos obrigatórios ausentes, formato inválido, etc.). |
| **`401 Unauthorized`** | `Unauthorized` | Token ausente, expirado, inválido ou credenciais de login incorretas. |
| **`403 Forbidden`** | `Forbidden` | Usuário autenticado, mas com permissão insuficiente (ex: Cliente tentando acessar área Admin). |
| **`404 Not Found`** | `Not Found` | Recurso solicitado ou rota não encontrada. |
| **`409 Conflict`** | `Conflict` | Conflito de dados no banco (ex: e-mail já em uso ou vínculo vendedor-fornecedor duplicado). |
| **`500 Internal Server Error`** | `Internal Server Error` | Erro inesperado capturado pelo servidor. |

### 1.3 Matriz de Papéis de Acesso (RBAC)

| ID do Papel | Nome | Descrição |
| :---: | :--- | :--- |
| **`1`** | **`Cliente` (`CUSTOMER`)** | Acesso ao catálogo público, autocadastro, perfil pessoal e listas de favoritos. |
| **`2`** | **`Vendedor` (`SELLER`)** | Acesso operacional, leitura de fornecedores associados e gestão futura de produtos. |
| **`3`** | **`Administrador` (`ADMIN`)** | Acesso total e irrestrito: gestão de usuários, fornecedores, vínculos e auditoria. |

---

## 📋 2. Sumário Rápido de Endpoints

| Método | Rota | Autenticação | Permissão Mínima | Descrição |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/api/v1/health` | ❌ Não | Público | Healthcheck e uptime do servidor |
| `POST` | `/api/v1/auth/register` | ❌ Não | Público | Autocadastro de novo Cliente |
| `POST` | `/api/v1/auth/login` | ❌ Não | Público | Login por e-mail e senha |
| `GET` | `/api/v1/auth/me` | ✅ Sim | Qualquer autenticado | Perfil do usuário da sessão atual |
| `GET` | `/api/v1/users` | ✅ Sim | `ADMIN` (3) | Listagem paginada de usuários |
| `POST` | `/api/v1/users` | ✅ Sim | `ADMIN` (3) | Criação de usuário com perfil arbitrário |
| `GET` | `/api/v1/users/:id` | ✅ Sim | `ADMIN` (3) | Detalhes de um usuário específico |
| `PUT` | `/api/v1/users/:id` | ✅ Sim | `ADMIN` (3) | Atualização de cadastro e perfil |
| `DELETE` | `/api/v1/users/:id` | ✅ Sim | `ADMIN` (3) | Desativação lógica (soft delete) de usuário |
| `GET` | `/api/v1/suppliers` | ✅ Sim | `SELLER` (2) ou `ADMIN` (3) | Listagem de fornecedores parceiros |
| `GET` | `/api/v1/suppliers/:id` | ✅ Sim | `SELLER` (2) ou `ADMIN` (3) | Detalhes de fornecedor específico |
| `POST` | `/api/v1/suppliers` | ✅ Sim | `ADMIN` (3) | Cadastro de novo fornecedor |
| `PUT` | `/api/v1/suppliers/:id` | ✅ Sim | `ADMIN` (3) | Atualização de fornecedor existente |
| `DELETE` | `/api/v1/suppliers/:id` | ✅ Sim | `ADMIN` (3) | Desativação lógica (soft delete) de fornecedor |
| `GET` | `/api/v1/users/:userId/suppliers` | ✅ Sim | `ADMIN` (3) | Fornecedores vinculados a um vendedor |
| `POST` | `/api/v1/users/:userId/suppliers` | ✅ Sim | `ADMIN` (3) | Vincular vendedor a um fornecedor |
| `DELETE` | `/api/v1/users/:userId/suppliers/:supplierId` | ✅ Sim | `ADMIN` (3) | Desvincular fornecedor de um vendedor |

---

## 🔑 3. Módulo de Autenticação (`/api/v1/auth`)

### 3.1 Autocadastro de Cliente
Cria a conta do usuário (role `1 = Cliente`) e o perfil cadastral em transação única.

- **Método / Rota**: `POST /api/v1/auth/register`
- **Acesso**: Público (sem token)
- **Request Body**:
  ```json
  {
    "fullName": "Maria Silva",
    "email": "maria.silva@exemplo.com",
    "password": "senhaSegura123",
    "phone": "(51) 98765-4321",
    "city": "Lajeado"
  }
  ```
  - `fullName` *(obrigatório, string, mín. 2 caracteres)*
  - `email` *(obrigatório, formato de e-mail válido)*
  - `password` *(obrigatório, mín. 6 caracteres)*
  - `phone` *(opcional, string)*
  - `city` *(opcional, string)*

- **Response `201 Created`**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "1e72ad18-4f27-4a0b-a630-d3221b6d0e51",
      "email": "maria.silva@exemplo.com",
      "role": 1,
      "fullName": "Maria Silva",
      "phone": "(51) 98765-4321",
      "city": "Lajeado"
    }
  }
  ```
- **Erros Mapeados**:
  - `400 Bad Request`: Validação de dados (ex: e-mail inválido, senha curta).
  - `409 Conflict`: `{"error": "Conflict", "message": "Este e-mail já está em uso."}`

---

### 3.2 Login com Credenciais
Valida o e-mail e a senha contra o hash Argon2id e emite o token JWT com 24h de validade.

- **Método / Rota**: `POST /api/v1/auth/login`
- **Acesso**: Público (sem token)
- **Request Body**:
  ```json
  {
    "email": "admin@gmail.com",
    "password": "admin123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "email": "admin@gmail.com",
      "role": 3,
      "fullName": "Administrador Geral",
      "phone": "(51) 99999-9999",
      "city": "Cruzeiro do Sul"
    }
  }
  ```
- **Erros Mapeados**:
  - `400 Bad Request`: Campos ausentes ou inválidos.
  - `401 Unauthorized`: `{"error": "Unauthorized", "message": "Credenciais inválidas."}` (para senha incorreta, usuário não cadastrado ou excluído logicamente).

---

### 3.3 Obter Perfil do Usuário Autenticado
Retorna os dados cadastrais da sessão para reidratação do estado do usuário no Pinia.

- **Método / Rota**: `GET /api/v1/auth/me`
- **Acesso**: Autenticado (qualquer papel: Cliente, Vendedor ou Admin)
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
  ```json
  {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "email": "admin@gmail.com",
    "role": 3,
    "fullName": "Administrador Geral",
    "phone": "(51) 99999-9999",
    "city": "Cruzeiro do Sul"
  }
  ```
- **Erros Mapeados**:
  - `401 Unauthorized`: Token ausente, inválido ou expirado.
  - `404 Not Found`: Usuário não encontrado ou inativo.

---

## 👥 4. Módulo de Gestão de Usuários (`/api/v1/users`)

> [!NOTE]
> Todos os endpoints deste módulo exigem autenticação com papel **`ADMIN` (3)**.

### 4.1 Listar Usuários (Paginado com Filtros)

- **Método / Rota**: `GET /api/v1/users`
- **Query Parameters**:
  - `page`: *(opcional, number, padrão: 1)*
  - `limit`: *(opcional, number, padrão: 20, máx: 100)*
  - `search`: *(opcional, string, busca por nome completo ou e-mail)*
  - `role`: *(opcional, number: 1, 2 ou 3)*
- **Exemplo**: `GET /api/v1/users?page=1&limit=10&search=silva&role=1`
- **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "id": "1e72ad18-4f27-4a0b-a630-d3221b6d0e51",
        "email": "maria.silva@exemplo.com",
        "role": 1,
        "fullName": "Maria Silva",
        "phone": "(51) 98765-4321",
        "city": "Lajeado",
        "createdAt": "2026-09-23T20:00:00.000Z",
        "updatedAt": "2026-09-23T20:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
  ```

---

### 4.2 Obter Usuário por ID

- **Método / Rota**: `GET /api/v1/users/:id`
- **Response `200 OK`**:
  ```json
  {
    "id": "1e72ad18-4f27-4a0b-a630-d3221b6d0e51",
    "email": "maria.silva@exemplo.com",
    "role": 1,
    "fullName": "Maria Silva",
    "phone": "(51) 98765-4321",
    "city": "Lajeado",
    "createdAt": "2026-09-23T20:00:00.000Z",
    "updatedAt": "2026-09-23T20:00:00.000Z"
  }
  ```
- **Erros**: `404 Not Found` caso o ID não exista ou esteja excluído logicamente.

---

### 4.3 Criar Usuário Administrativamente
Permite ao Admin cadastrar novos Vendedores (`2`), Clientes (`1`) ou novos Administradores (`3`).

- **Método / Rota**: `POST /api/v1/users`
- **Request Body**:
  ```json
  {
    "email": "vendedor.novo@emporio.com.br",
    "password": "senhaForte123",
    "role": 2,
    "fullName": "Carlos Eduardo",
    "phone": "(51) 99111-2222",
    "city": "Estrela"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "id": "7b82cd44-2f31-419b-a010-f123456789ab",
    "email": "vendedor.novo@emporio.com.br",
    "role": 2,
    "fullName": "Carlos Eduardo",
    "phone": "(51) 99111-2222",
    "city": "Estrela",
    "createdAt": "2026-09-23T20:10:00.000Z",
    "updatedAt": "2026-09-23T20:10:00.000Z"
  }
  ```
- **Erros**: `400 Bad Request` (validação) / `409 Conflict` (e-mail já cadastrado).

---

### 4.4 Atualizar Usuário
Permite atualizar dados de perfil, trocar o papel de acesso ou redefinir a senha.

- **Método / Rota**: `PUT /api/v1/users/:id`
- **Request Body** *(ao menos 1 campo deve ser enviado)*:
  ```json
  {
    "fullName": "Carlos Eduardo Santos",
    "phone": "(51) 99333-4444",
    "city": "Teutônia",
    "role": 2,
    "password": "novaSenhaOpcional123"
  }
  ```
- **Response `200 OK`**: Retorna o objeto `User` atualizado.
- **Erros**: `400 Bad Request` / `404 Not Found`.

---

### 4.5 Desativar Usuário (Soft Delete)
Aplica exclusão lógica (`deleted_at = CURRENT_TIMESTAMP`) nas tabelas `users`, `clients` e desativa vínculos ativos em `user_suppliers`.

- **Método / Rota**: `DELETE /api/v1/users/:id`
- **Response `200 OK`**:
  ```json
  {
    "message": "Usuário desativado com sucesso."
  }
  ```
- **Erros**: `404 Not Found` caso o usuário já esteja excluído ou não exista.

---

## 🏭 5. Módulo de Fornecedores (`/api/v1/suppliers`)

### 5.1 Listar Fornecedores
Retorna a listagem de marcas e fábricas parceiras ativas, ordenadas alfabeticamente por nome.

- **Método / Rota**: `GET /api/v1/suppliers`
- **Acesso**: `SELLER` (2) ou `ADMIN` (3)
- **Response `200 OK`**:
  ```json
  [
    {
      "id": "c57b8df1-2345-6789-0123-bcdefa234567",
      "name": "Estofados Henz Sul",
      "contact": "comercial@estofadoshenz.com.br",
      "active": true,
      "createdAt": "2026-09-23T18:00:00.000Z",
      "updatedAt": "2026-09-23T18:00:00.000Z"
    }
  ]
  ```
- **Erros**: `401 Unauthorized` / `403 Forbidden` para Clientes.

---

### 5.2 Obter Fornecedor por ID

- **Método / Rota**: `GET /api/v1/suppliers/:id`
- **Acesso**: `SELLER` (2) ou `ADMIN` (3)
- **Response `200 OK`**: Retorna o objeto `Supplier`.
- **Erros**: `404 Not Found`.

---

### 5.3 Criar Fornecedor

- **Método / Rota**: `POST /api/v1/suppliers`
- **Acesso**: Exclusivo `ADMIN` (3)
- **Request Body**:
  ```json
  {
    "name": "Móveis e Madeiras Vale",
    "contact": "(51) 3710-0000",
    "active": true
  }
  ```
- **Response `201 Created`**: Retorna o objeto `Supplier` criado.
- **Erros**: `400 Bad Request` (nome com menos de 2 caracteres ou campos inválidos).

---

### 5.4 Atualizar Fornecedor

- **Método / Rota**: `PUT /api/v1/suppliers/:id`
- **Acesso**: Exclusivo `ADMIN` (3)
- **Request Body**:
  ```json
  {
    "name": "Móveis Vale do Taquari",
    "contact": "(51) 3710-1111",
    "active": false
  }
  ```
- **Response `200 OK`**: Retorna o objeto `Supplier` atualizado.
- **Erros**: `400 Bad Request` / `404 Not Found`.

---

### 5.5 Desativar Fornecedor (Soft Delete)

- **Método / Rota**: `DELETE /api/v1/suppliers/:id`
- **Acesso**: Exclusivo `ADMIN` (3)
- **Response `200 OK`**:
  ```json
  {
    "message": "Fornecedor desativado com sucesso."
  }
  ```
- **Erros**: `404 Not Found`.

---

## 🔗 6. Vínculos Vendedor ↔ Fornecedor (`user_suppliers`)

> [!IMPORTANT]
> Gerenciamento do isolamento multi-empresa: vendedores só podem visualizar e gerenciar produtos de fornecedores aos quais possuem vínculo ativo na tabela `user_suppliers`.

### 6.1 Listar Fornecedores Vinculados a um Vendedor

- **Método / Rota**: `GET /api/v1/users/:userId/suppliers`
- **Acesso**: Exclusivo `ADMIN` (3)
- **Response `200 OK`**:
  ```json
  [
    {
      "id": "c57b8df1-2345-6789-0123-bcdefa234567",
      "name": "Estofados Henz Sul",
      "contact": "comercial@estofadoshenz.com.br",
      "active": true,
      "linkedAt": "2026-09-23T20:20:00.000Z"
    }
  ]
  ```
- **Erros**: `404 Not Found` caso o `userId` não exista.

---

### 6.2 Vincular Fornecedor a um Vendedor

- **Método / Rota**: `POST /api/v1/users/:userId/suppliers`
- **Acesso**: Exclusivo `ADMIN` (3)
- **Request Body**:
  ```json
  {
    "supplierId": "c57b8df1-2345-6789-0123-bcdefa234567"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "id": "link-uuid-1234",
    "userId": "7b82cd44-2f31-419b-a010-f123456789ab",
    "supplierId": "c57b8df1-2345-6789-0123-bcdefa234567",
    "createdAt": "2026-09-23T20:25:00.000Z"
  }
  ```
- **Erros**:
  - `400 Bad Request`: `supplierId` não é um UUID válido.
  - `404 Not Found`: Usuário ou fornecedor não encontrado.
  - `409 Conflict`: `{"error": "Conflict", "message": "Este fornecedor já está vinculado a este vendedor."}`.

---

### 6.3 Desvincular Fornecedor de um Vendedor (Revogação Lógica)

- **Método / Rota**: `DELETE /api/v1/users/:userId/suppliers/:supplierId`
- **Acesso**: Exclusivo `ADMIN` (3)
- **Response `200 OK`**:
  ```json
  {
    "message": "Vínculo revogado com sucesso."
  }
  ```
- **Erros**: `404 Not Found` caso o vínculo não exista ou já esteja revogado.

---

## 💻 7. Interfaces TypeScript para o Front-end (`apps/web/src/types/api.ts`)

Copie e cole este bloco de tipagens diretamente no frontend para garantir conformidade estrita de tipos com o backend:

```typescript
// Roles do Sistema
export const ROLES = {
  CUSTOMER: 1,
  SELLER: 2,
  ADMIN: 3,
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];

// Usuário e Perfil
export interface UserProfile {
  id: string;
  email: string;
  role: RoleType;
  fullName: string;
  phone: string | null;
  city: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Resposta de Autenticação
export interface AuthResponse {
  token: string;
  user: UserProfile;
}

// Payloads de Autenticação
export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  city?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// Fornecedores
export interface Supplier {
  id: string;
  name: string;
  contact: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssignedSupplier extends Supplier {
  linkedAt: string;
}

export interface CreateSupplierPayload {
  name: string;
  contact?: string;
  active?: boolean;
}

export interface UpdateSupplierPayload {
  name?: string;
  contact?: string;
  active?: boolean;
}

// Criação e Atualização de Usuários (Admin)
export interface CreateUserPayload {
  email: string;
  password: string;
  role: RoleType;
  fullName: string;
  phone?: string;
  city?: string;
}

export interface UpdateUserPayload {
  fullName?: string;
  phone?: string;
  city?: string;
  role?: RoleType;
  password?: string;
}

// Paginação Genérica
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Formato de Erro Padronizado
export interface ApiErrorResponse {
  error: string;
  message: string;
}
```

---

## 🛠️ 8. Exemplo de Cliente HTTP Base para o Front-end (`apps/web/src/services/api.ts`)

```typescript
import type { ApiErrorResponse } from "@/types/api";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("emporio_token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse;
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        error: "HttpError",
        message: `Falha na requisição: ${response.statusText}`,
      };
    }

    // Tratamento de sessão expirada
    if (response.status === 401 && endpoint !== "/auth/login") {
      localStorage.removeItem("emporio_token");
      window.location.href = "/login";
    }

    throw errorData;
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
```
