# 002 · Requisitos de senha segura no cadastro e na redefinição

| Campo      | Valor                                                                 |
| ---------- | --------------------------------------------------------------------- |
| Data       | 2026-10-29                                                            |
| Status     | resolvido (aguardando teste manual)                                   |
| Severidade | média                                                                 |
| Camada     | [FE]                                                                  |
| Tela       | `/cadastro`, `/perfil`, `/admin/usuarios/novo`, `/admin/usuarios/:id/editar` |
| Referência | PRD RF07, RF20, RNF03                                                 |

## O que acontece

- O checklist "Requisitos para uma Senha Segura" e a barra de força existiam só no formulário de usuário (admin e perfil), escritos direto na tela.
- O autocadastro (`/cadastro`) validava apenas o mínimo de 8 caracteres, sem checklist nem indicador de força.
- A confirmação de senha era conferida em cada tela, separada dos requisitos.

## O que deveria acontecer

- Todas as telas que criam ou redefinem senha mostram o mesmo painel: barra de força, os 5 requisitos e a conferência da confirmação.
- O formulário só aceita a senha quando ela cumpre todos os requisitos **e** a confirmação é igual.
- Na edição, a senha é opcional: em branco, mantém a atual e não valida nada.

## Correção

- **Componente novo** [`PasswordStrengthPanel.vue`](../../frontend/src/components/auth/PasswordStrengthPanel.vue): concentra toda a validação (requisitos, força, confirmação) e só devolve `true`/`false` pela tela.

  ```vue
  <PasswordStrengthPanel
    v-model:valid="isPasswordSecure"
    :password="form.password"
    :confirm-password="form.confirmPassword"
  />
  ```

  | Prop / modelo     | Tipo      | Função                                                                       |
  | ----------------- | --------- | ---------------------------------------------------------------------------- |
  | `password`        | `string`  | Senha digitada                                                               |
  | `confirmPassword` | `string`  | Confirmação digitada                                                         |
  | `v-model:valid`   | `boolean` | `true` só quando cumpre os 5 requisitos e a confirmação é igual (não vazia) |

  Requisitos: mínimo de 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial. A barra de força mede só esses 5 itens; "A confirmação é igual à senha" aparece como último item do checklist.

- [`UsuarioForm.vue`](../../frontend/src/views/admin/usuarios/UsuarioForm.vue) (admin criar/editar e `/perfil`): usa o componente; ordem dos campos é senha → confirmação → painel. Na edição, confirmação e painel só aparecem com senha digitada, e apagar a senha limpa a confirmação e os erros.
- [`RegisterView.vue`](../../frontend/src/views/auth/RegisterView.vue) (`/cadastro`): passa a exibir o painel e a exigir os 5 requisitos. O rótulo deixou de dizer "mínimo 8 caracteres".
- [PRD](../PRD.md) RF07 atualizado: o autocadastro exige os mesmos critérios na interface. A API continua validando só o mínimo de 8 caracteres (RNF03).
- Ordem das mensagens ao enviar: primeiro "não coincide" na confirmação; se as senhas forem iguais mas fracas, o erro de requisitos aparece no campo de senha.
- Validado: `vue-tsc --noEmit` e `eslint` sem erros. **Não testado no navegador** (ver roteiro abaixo).

## Como testar

Senhas de apoio:

| Senha        | Resultado esperado                         |
| ------------ | ------------------------------------------ |
| `abc`        | Fraca (1–2 requisitos)                     |
| `abcdefgh1`  | Razoável (3–4 requisitos)                  |
| `Abcdefg1!`  | Forte e segura (5 requisitos)              |

### 1. Cadastro (`/cadastro`, sem sessão)

- [ ] O painel aparece abaixo do campo "Senha" já ao abrir a tela, com nível "Não definida" e todos os itens cinza.
- [ ] Digitar `abc`: barra vermelha "Senha Fraca", só "minúscula" verde.
- [ ] Digitar `abcdefgh1`: barra âmbar "Senha Razoável".
- [ ] Digitar `Abcdefg1!`: barra verde "Senha Forte e Segura", os 5 requisitos verdes.
- [ ] Com confirmação vazia ou diferente, o item "A confirmação é igual à senha" fica cinza.
- [ ] Confirmação igual: o item fica verde.
- [ ] Enviar com senhas diferentes: erro "As senhas não coincidem." na confirmação.
- [ ] Enviar com `abcdefgh1` nos dois campos: erro de requisitos no campo de senha, sem chamar a API.
- [ ] Enviar com `Abcdefg1!` nos dois campos e demais dados válidos: conta criada e redirecionamento.

### 2. Admin · novo usuário (`/admin/usuarios/novo`, perfil Administrador)

- [ ] Ordem: "Senha de Acesso *" → "Confirmar Senha *" → painel.
- [ ] Painel visível desde o início.
- [ ] Mesmos casos de senha fraca, diferente e forte do item 1.
- [ ] Ao corrigir a senha até ficar válida e igual, os erros dos dois campos somem sozinhos.
- [ ] Usuário criado com senha forte consegue entrar em `/login`.

### 3. Admin · editar usuário (`/admin/usuarios/:id/editar`)

- [ ] Senha em branco: aparece "Redefinir Senha (opcional)" e "Deixe em branco para manter a atual"; sem confirmação e sem painel.
- [ ] Salvar com senha em branco: salva os demais dados e a senha antiga continua funcionando.
- [ ] Digitar uma senha: aparecem "Confirmar Nova Senha *" e o painel abaixo dela; a dica "Deixe em branco" some.
- [ ] Apagar a senha digitada: confirmação e painel somem, a confirmação é limpa e os erros desaparecem.
- [ ] Salvar com senha fraca ou confirmação diferente: bloqueado com o erro correspondente.
- [ ] Salvar com `Abcdefg1!` nos dois campos: sucesso; o usuário entra com a nova senha e não entra mais com a antiga.

### 4. Perfil próprio (`/perfil`, Cliente ou Vendedor)

- [ ] Mesmo comportamento do item 3 (senha opcional, dois campos, painel só com senha digitada).
- [ ] Sem campo "Perfil de Acesso"; e-mail bloqueado.
- [ ] Após salvar com nova senha, os campos de senha são limpos.
- [ ] Sair e entrar novamente com a nova senha.

### 5. Responsivo

- [ ] Repetir os itens 1 e 4 em 375px: painel sem rolagem horizontal e itens do checklist legíveis.

## Print

Sem print ainda; anexar em `prints/002-…` durante o teste.
