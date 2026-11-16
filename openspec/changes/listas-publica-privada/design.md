## Context

`lists.share_slug` (UUID) e `lists.is_public` existem desde a migração 014. A rota pública `GET /listas/compartilhadas/:shareSlug` já filtra `is_public = TRUE`. Falta o padrão privado e a rota que muda a visibilidade.

## Goals / Non-Goals

**Goals:**
- O cliente decide, lista a lista, se o link funciona.
- O cliente copia o link quando a lista é pública.

**Non-Goals:**
- Gerar um novo UUID (revogar o link antigo). Desligar e ligar mantém o mesmo link.
- Mudar o tablet de atendimento: a busca por e-mail continua mostrando todas as listas do cliente (RNF04); colar o link só funciona para lista pública.

## Decisions

- **Rota própria `PATCH /:id/compartilhamento`** em vez de reaproveitar `PATCH /:id`: renomear é proibido nas listas padrão e mudar a visibilidade não é, então juntar os dois exigiria regras cruzadas na mesma rota.
- **Privada por padrão, inclusive as existentes**: o dono escolheu compartilhar antes de qualquer link funcionar (RNF04). A migração faz `UPDATE ... SET is_public = FALSE`.
- **Front sem componente novo**: o toggle é um `UiButton` que alterna ícone e texto, e o link aparece num `input` somente leitura ao lado de "Copiar link".
- **Página própria em vez de modal**: `/lista/:shareSlug` não depende do catálogo e o link fica legível. A página só mostra o que o back devolve; quem decide se a lista é pública é a rota `GET /listas/compartilhadas/:shareSlug`. `/catalogo?lista=` é removido sem redirecionamento: como toda lista ficou privada na migração 016, os links antigos já tinham parado de funcionar.
- **WhatsApp sem link quando privada**: a mensagem continua com a lista dos itens; a loja consulta o cliente pelo e-mail no tablet.

## Risks / Trade-offs

- [Links já enviados param de abrir] → o modal compartilhado mostra "Esta lista é privada ou não está mais disponível."; o cliente reativa o link e o mesmo endereço volta a abrir.
