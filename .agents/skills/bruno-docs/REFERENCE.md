# Formato dos arquivos `.bru`

Indentação de 2 espaços dentro de cada bloco. A ordem dos blocos é: `meta`, método, `params:query`, `params:path`, `auth:bearer`, `body:json`, `script:post-response`, `docs`. Omita os blocos que não se aplicam.

## Estrutura da collection

```
docs/backend/collections/bruno/
├── bruno.json
├── collection.bru
├── environments/        # Local.bru e Docker.bru: baseUrl e token
└── <Domínio>/
    ├── folder.bru
    └── <Ação> <Recurso>.bru
```

Nomes de arquivo usados no projeto: `List X.bru`, `Get X by ID.bru`, `Create X.bru`, `Update X.bru`, `Delete X.bru`. O `meta.name` é a versão em português, com o perfil entre parênteses quando a rota é restrita: `Cadastrar Categoria (Admin)`.

## `folder.bru`

```
meta {
  name: Categories
}

docs {
  ## Regras comuns

  - **`:id`**: deve ser um UUID válido; caso contrário a resposta é `400 Bad Request`.
  - **Paginação**: `page` inteiro de 1 a 10000 (padrão 1) e `limit` inteiro de 1 a 100 (padrão 20).
}
```

O bloco `docs` é opcional; use quando houver regra compartilhada pelo domínio.

## Requisição com body e autenticação

```
meta {
  name: Cadastrar Categoria (Admin)
  type: http
  seq: 3
}

post {
  url: {{baseUrl}}/categorias
  body: json
  auth: bearer
}

auth:bearer {
  token: {{token}}
}

body:json {
  {
    "name": "Área Externa",
    "slug": "area-externa",
    "active": true
  }
}

docs {
  Exclusivo do Administrador (`401` sem token, `403` para outros perfis).
  `name` é obrigatório, de 2 a 255 caracteres. `slug` é opcional (gerado a partir do nome). `active` é opcional (padrão `true`).
  `400` para payload inválido. `409` se já existir categoria não deletada com o mesmo slug.
}
```

## Requisição com path param

O caminho mantém `:nome` e o valor vai em `params:path`. O nome do parâmetro deve ser igual ao do `routes.ts`.

```
get {
  url: {{baseUrl}}/categorias/:id
  body: none
  auth: none
}

params:path {
  id: 00000000-0000-0000-0000-000000000000
}
```

## Requisição com query params

Parâmetros ativos aparecem na URL e no bloco. Parâmetros opcionais desativados recebem o prefixo `~` e ficam fora da URL.

```
get {
  url: {{baseUrl}}/categorias?page=1&limit=20
  body: none
  auth: bearer
}

params:query {
  page: 1
  limit: 20
  ~search: quarto
  ~active: false
}

auth:bearer {
  token: {{token}}
}
```

## Script de pós-resposta

Só para requisições que devolvem JWT (login e autocadastro), para gravar o token no ambiente:

```
script:post-response {
  if (res.status === 200 && res.body.token) {
    bru.setEnvVar("token", res.body.token);
  }
}
```

## `seq`

Define a ordem dentro da pasta. Leituras públicas primeiro, depois mutações, depois variantes autenticadas. Ao inserir uma requisição, use o próximo número livre em vez de renumerar as existentes.
