## MODIFIED Requirements

### Requirement: Compartilhamento Público e Solicitação de Orçamento via WhatsApp
The system MUST provide in Level 2 of `MinhasListasModal.vue` a control to make the list public or private, the shareable link with a copy action while the list is public, and an action to generate a pre-filled WhatsApp quote inquiry containing the list details.

#### Scenario: Lista privada
- **WHEN** o usuário abre uma lista privada (padrão de toda lista)
- **THEN** o botão mostra "Privada", o texto "Só você vê esta lista." é exibido e não há link nem botão de copiar.

#### Scenario: Tornar a lista pública
- **WHEN** o usuário clica em "Privada"
- **THEN** o sistema chama `PATCH /listas/:id/compartilhamento` com `isPublic: true`, o botão passa a mostrar "Pública" e o link `/lista/<shareSlug>` aparece com o botão "Copiar link".

#### Scenario: Cópia do link público da lista
- **WHEN** o usuário clica em "Copiar link" numa lista pública
- **THEN** a URL contendo o `shareSlug` é copiada para a área de transferência e uma mensagem de confirmação é exibida.

#### Scenario: Tornar a lista privada
- **WHEN** o usuário clica em "Pública"
- **THEN** o sistema envia `isPublic: false`, o link some da tela e deixa de abrir para visitantes.


#### Scenario: Solicitação de orçamento via WhatsApp
- **WHEN** o usuário clica em "Solicitar Orçamento no WhatsApp"
- **THEN** o sistema gera uma URL `https://wa.me/...` contendo o nome da lista, a relação de itens com preços e, somente se a lista for pública, o link compartilhado, abrindo o WhatsApp em nova aba.

## ADDED Requirements

### Requirement: Página própria da lista compartilhada
The system MUST serve shared lists on the dedicated route `/lista/:shareSlug` (`ListaCompartilhadaView.vue`), loading the list only from `GET /listas/compartilhadas/:shareSlug` so the backend decides whether it is public. The page MUST NOT require login and MUST NOT show owner data.

#### Scenario: Lista pública
- **WHEN** um visitante abre `/lista/<shareSlug>` de uma lista pública
- **THEN** a página mostra o nome da lista, a quantidade de móveis, o total estimado e os itens (foto, nome, preço e acabamento), cada um com link para `/catalogo/<slug do produto>`.

#### Scenario: Lista privada, excluída ou UUID inválido
- **WHEN** o back responde `404`
- **THEN** a página mostra "Esta lista é privada ou não está mais disponível." e um link para o catálogo.

#### Scenario: Lista sem móveis
- **WHEN** a lista pública não tem itens
- **THEN** a página mostra "Esta lista ainda não tem móveis."
