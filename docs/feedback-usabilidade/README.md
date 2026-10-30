# Feedback de usabilidade

Caderno de achados da revisão de usabilidade do portal. Cada achado é um arquivo curto, registrado na hora em que aparece, para ser triado depois.

Isto **não** é OpenSpec nem backlog e não cria regra de negócio. Quando um achado for aceito para correção:

1. Se mudar regra ou comportamento do produto, atualize o [PRD](../PRD.md) primeiro.
2. Formalize com OpenSpec ou registre a tarefa conforme o [padrão de histórias e tarefas](../padrao-historias-tarefas.md).
3. Volte aqui e atualize o status do achado com o link da mudança.

## Como registrar

- Um arquivo por achado: `NNN-titulo-curto.md` (numeração sequencial).
- Prints em [`prints/`](./prints/), com o mesmo prefixo `NNN-`.
- Copie o modelo abaixo e adicione uma linha no índice.

```markdown
# NNN · Título curto

| Campo      | Valor                                              |
| ---------- | -------------------------------------------------- |
| Data       | AAAA-MM-DD                                         |
| Status     | aberto · triado · em correção · resolvido · descartado |
| Severidade | alta · média · baixa                               |
| Camada     | [FE] · [BE] · [DB]                                 |
| Tela       | onde acontece                                      |
| Referência | RF/UC do PRD, se houver                            |

## O que acontece

## O que deveria acontecer

## Como reproduzir

## Notas técnicas

## Print
```

**Severidade**: alta = quebra regra do PRD, segurança ou perde dado do usuário; média = atrapalha o fluxo principal; baixa = acabamento visual ou texto.

## Índice

| #   | Achado                                                        | Severidade | Camada    | Status |
| --- | ------------------------------------------------------------- | ---------- | --------- | ------ |
| 001 | [Favoritar produto sem estar logado](./001-favoritar-sem-login.md) | alta       | [FE] [BE] | resolvido |
| 002 | [Requisitos de senha segura no cadastro e na redefinição](./002-senha-segura-cadastro-e-redefinicao.md) | média      | [FE]      | resolvido (aguardando teste) |
| 003 | ["Orçar no WhatsApp" abre um número fictício](./003-orcar-whatsapp-numero-ficticio.md) | alta       | [FE]      | resolvido (aguardando deploy) |
| 004 | [Botões flutuantes cobrem nome e preço dos cards no celular](./004-botoes-flutuantes-sobre-cards.md) | média      | [FE]      | aberto |
