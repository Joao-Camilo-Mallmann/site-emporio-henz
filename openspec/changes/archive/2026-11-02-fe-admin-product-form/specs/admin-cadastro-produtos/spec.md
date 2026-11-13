## ADDED Requirements

### Requirement: Tela de cadastro de produto no painel
A aplicação SHALL oferecer a tela `/admin/produtos/novo`, aberta a Administrador e Vendedor, com o formulário em seis seções, mostradas uma etapa por vez: Dados Básicos, Preço e Disponibilidade, Dimensões, Variações de Acabamento, Fotos e Especificações Técnicas.

#### Scenario: Equipe acessa a tela
- **WHEN** um Administrador ou Vendedor autenticado acessa `/admin/produtos/novo`
- **THEN** a aplicação SHALL exibir o formulário vazio na primeira etapa, com o indicador das seis etapas e os botões "Cancelar" e "Próximo"

#### Scenario: Cliente é barrado
- **WHEN** um Cliente ou visitante tenta acessar `/admin/produtos/novo`
- **THEN** o guarda de rotas SHALL negar o acesso conforme a regra já aplicada às rotas `/admin`

#### Scenario: Atalho no painel
- **WHEN** um Administrador ou Vendedor abre `/admin`
- **THEN** o painel SHALL exibir o card "Produtos" com a ação "Novo Produto", que leva a `/admin/produtos/novo`

### Requirement: Categoria e subtipo a partir da API
O formulário SHALL carregar as categorias ativas com `GET /api/v1/categorias` e preencher o seletor de subtipo com os `subtypes` da categoria escolhida, sem chamar `/subtipos`.

#### Scenario: Escolha de categoria filtra os subtipos
- **WHEN** o usuário seleciona uma categoria
- **THEN** o seletor de subtipo SHALL listar apenas os subtipos dessa categoria e aceitar a opção "Sem subtipo"

#### Scenario: Troca de categoria limpa o subtipo
- **WHEN** o usuário troca a categoria depois de escolher um subtipo
- **THEN** o subtipo selecionado SHALL ser limpo

### Requirement: Seletor de fornecedor conforme o perfil
O seletor de fornecedor SHALL ser preenchido por `GET /api/v1/suppliers?active=true` e se comportar conforme o perfil e a quantidade de fornecedores devolvidos (RF16).

#### Scenario: Administrador escolhe qualquer fornecedor ativo
- **WHEN** um Administrador abre o formulário
- **THEN** o seletor SHALL listar todos os fornecedores ativos devolvidos pela API, sem pré-seleção

#### Scenario: Vendedor com um único vínculo
- **WHEN** um Vendedor cuja listagem devolve exatamente um fornecedor abre o formulário
- **THEN** esse fornecedor SHALL vir pré-selecionado e o seletor SHALL ficar desabilitado, com a indicação de empresa vinculada

#### Scenario: Vendedor com vários vínculos
- **WHEN** um Vendedor cuja listagem devolve mais de um fornecedor abre o formulário
- **THEN** o seletor SHALL listar somente esses fornecedores, sem pré-seleção

#### Scenario: Vendedor sem vínculo
- **WHEN** a listagem devolve zero fornecedores para um Vendedor
- **THEN** o formulário SHALL exibir o aviso de que não há empresa vinculada e o botão "Salvar produto" SHALL ficar desabilitado

### Requirement: Validação no navegador antes do envio
O formulário SHALL validar os campos no navegador com as mesmas regras da API e mostrar a mensagem junto ao campo, sem enviar requisição enquanto houver erro.

#### Scenario: Campos obrigatórios e limites
- **WHEN** o usuário clica em "Salvar produto" com nome ausente ou com menos de 2 caracteres, categoria ou fornecedor vazios, preço ausente ou negativo, parcelas fora de 1 a 48, ou qualquer dimensão vazia, não inteira ou menor que 1
- **THEN** o formulário SHALL marcar cada campo inválido com sua mensagem, rolar até o primeiro erro e não chamar a API

#### Scenario: Prazo de produto sob encomenda
- **WHEN** a disponibilidade é "Sob encomenda" e o prazo em dias está vazio ou é menor que 1
- **THEN** o formulário SHALL exigir um prazo inteiro maior ou igual a 1

#### Scenario: Prazo some em pronta entrega
- **WHEN** a disponibilidade é "Pronta entrega"
- **THEN** o campo de prazo SHALL ficar oculto e o payload SHALL omitir `estimatedDays`

### Requirement: Variações de acabamento
O formulário SHALL permitir incluir, editar, reordenar e remover variações com nome, tipo (`COLOR`, `FABRIC`, `WOOD` ou `FINISH`), cores hexadecimais, detalhes de acabamento em chave e valor, indicação de estoque e uma amostra de textura opcional.

#### Scenario: Cores sólidas ou bicolores
- **WHEN** o usuário adiciona uma ou mais cores a uma variação
- **THEN** a variação SHALL exibir um círculo de pré-visualização sólido para uma cor, dividido ao meio para duas e em fatias iguais para mais de duas

#### Scenario: Cor inválida
- **WHEN** uma cor digitada não segue o formato `#RRGGBB`
- **THEN** o formulário SHALL marcar a cor como inválida e bloquear o envio

#### Scenario: Ordem das variações
- **WHEN** o usuário move uma variação para cima ou para baixo
- **THEN** a ordem visual SHALL definir o `sortOrder` enviado, começando em 0

#### Scenario: Remoção de variação usada por foto
- **WHEN** o usuário remove uma variação à qual alguma foto estava associada
- **THEN** essas fotos SHALL voltar a ser fotos gerais do produto

### Requirement: Seleção de arquivos com preview local
O formulário SHALL aceitar fotos do produto e amostras de variação como arquivos locais, mostrar o preview no navegador sem converter para Base64 e recusar, antes de qualquer envio, arquivos acima de 2 MiB (2.097.152 bytes) ou fora de JPEG, PNG e WebP.

#### Scenario: Arquivo válido
- **WHEN** o usuário seleciona uma imagem JPEG, PNG ou WebP de até 2 MiB
- **THEN** o formulário SHALL mostrar a miniatura imediatamente a partir do próprio arquivo

#### Scenario: Arquivo grande demais
- **WHEN** o usuário seleciona uma imagem com mais de 2 MiB
- **THEN** o formulário SHALL recusar o arquivo e informar o tamanho enviado e o limite, sem comprimir a imagem

#### Scenario: Formato não aceito
- **WHEN** o usuário seleciona um arquivo que não é JPEG, PNG nem WebP
- **THEN** o formulário SHALL recusar o arquivo e informar os formatos aceitos

#### Scenario: Capa e ordem das fotos
- **WHEN** o usuário reordena as fotos ou associa uma foto a uma variação
- **THEN** a primeira foto sem variação SHALL ser indicada como capa, e a ordem da tela SHALL ser a ordem de envio

### Requirement: Gravação em etapas
Ao salvar, a aplicação SHALL criar o produto com `POST /api/v1/produtos`, em JSON e sem imagens, e depois enviar cada amostra com `PUT /api/v1/produtos/:id/variacoes/:variationId/amostra` e cada foto com `POST /api/v1/produtos/:id/imagens`, um arquivo por requisição e em sequência, em `multipart/form-data`.

#### Scenario: Associação das variações devolvidas
- **WHEN** a API responde `201` com o produto criado
- **THEN** a aplicação SHALL associar cada variação local ao `id` devolvido pelo `sortOrder` e usar esse `id` nas amostras e no `variationId` das fotos

#### Scenario: Progresso por arquivo
- **WHEN** os arquivos estão sendo enviados
- **THEN** cada amostra e foto SHALL exibir seu estado (aguardando, enviando, enviada ou erro), e o formulário SHALL ficar bloqueado para edição

#### Scenario: Sucesso completo
- **WHEN** o produto e todos os arquivos foram gravados
- **THEN** a aplicação SHALL exibir um toast de sucesso e redirecionar para `/admin`

### Requirement: Falha parcial sem recriar o produto
Se o produto foi criado e algum arquivo falhou, a aplicação SHALL manter o produto criado, mostrar o erro devolvido pela API em cada arquivo e permitir reenviar só o que falhou.

#### Scenario: Reenvio de arquivo com falha
- **WHEN** uma foto ou amostra falha e o usuário clica em "Tentar de novo"
- **THEN** a aplicação SHALL reenviar só aquele arquivo para o produto já criado, sem chamar `POST /api/v1/produtos` de novo

#### Scenario: Concluir mesmo com falha
- **WHEN** restam arquivos com erro e o usuário escolhe concluir
- **THEN** a aplicação SHALL avisar quantos arquivos não foram enviados e redirecionar para `/admin`

### Requirement: Erros devolvidos pela API no cadastro
A aplicação SHALL exibir a mensagem devolvida pela API quando o `POST /api/v1/produtos` falhar, mantendo os dados preenchidos.

#### Scenario: Slug duplicado
- **WHEN** a API responde `409 Conflict`
- **THEN** o formulário SHALL mostrar o erro no campo de slug e manter o restante dos dados

#### Scenario: Fornecedor fora do vínculo ou dados inválidos
- **WHEN** a API responde `400` ou `403`
- **THEN** o formulário SHALL exibir a mensagem da API no alerta geral do formulário

### Requirement: Listagem administrativa de produtos
A aplicação SHALL oferecer a tela `/admin/produtos`, aberta a Administrador e Vendedor, com a listagem paginada de `GET /api/v1/produtos` e as ações de cadastrar, editar e desativar (UC08).

#### Scenario: Equipe acessa a listagem
- **WHEN** um Administrador ou Vendedor autenticado acessa `/admin/produtos`
- **THEN** a aplicação SHALL listar os produtos devolvidos pela API com miniatura da capa, nome, categoria, fornecedor, preço, disponibilidade e status, e SHALL exibir a paginação e o total de registros

#### Scenario: Escopo por perfil
- **WHEN** um Vendedor acessa a listagem
- **THEN** a tela SHALL exibir apenas os produtos devolvidos pela API, que já restringe o resultado aos fornecedores vinculados, sem filtrar por fornecedor no cliente

#### Scenario: Filtros
- **WHEN** o usuário informa busca por texto, categoria, fornecedor, disponibilidade ou status
- **THEN** a listagem SHALL enviar os filtros à API como `search`, `categoryId`, `supplierId`, `availabilityType` e `active`, e SHALL voltar para a primeira página

#### Scenario: Produto sem foto
- **WHEN** um produto da listagem tem `thumbnailUrl` nulo
- **THEN** a linha SHALL exibir um espaço reservado no lugar da miniatura, sem imagem quebrada

#### Scenario: Lista vazia
- **WHEN** a API devolve nenhum produto
- **THEN** a tela SHALL diferenciar "nenhum resultado para os filtros aplicados", com a ação de limpar os filtros, de "nenhum produto cadastrado", com o atalho de cadastro

#### Scenario: Desativação a partir da listagem
- **WHEN** o usuário aciona "Desativar" em um produto ativo e confirma no diálogo
- **THEN** a tela SHALL chamar `DELETE /api/v1/produtos/:id`, marcar o produto como inativo na lista e avisar o resultado

### Requirement: Tela de edição de produto
A aplicação SHALL oferecer a tela `/admin/produtos/:id/editar`, aberta a Administrador e Vendedor, com o mesmo formulário de seis seções do cadastro preenchido pelo produto de `GET /api/v1/produtos/:id`.

#### Scenario: Carga do produto
- **WHEN** um Administrador ou Vendedor abre a edição de um produto autorizado
- **THEN** o formulário SHALL vir preenchido com os dados cadastrais, as variações ordenadas por `sortOrder` e as fotos já publicadas, e o botão de envio SHALL ser "Salvar alterações"

#### Scenario: Produto inexistente ou fora do escopo
- **WHEN** a API responde `404 Not Found` ao carregar o produto
- **THEN** a tela SHALL exibir o aviso de produto não encontrado e o caminho de volta para a listagem

#### Scenario: Gravação das alterações
- **WHEN** o usuário salva o formulário válido
- **THEN** a tela SHALL enviar `PUT /api/v1/produtos/:id` com as variações existentes identificadas por `id`, as novas sem `id` e as removidas omitidas do corpo

#### Scenario: Arquivos novos na edição
- **WHEN** a atualização é aceita e há amostras ou fotos novas escolhidas
- **THEN** a tela SHALL travar o formulário e enviar os arquivos um por requisição, primeiro as amostras e depois as fotos, com progresso, erro por arquivo e "Tentar de novo"

#### Scenario: Exclusão de foto publicada
- **WHEN** o usuário exclui uma foto já publicada e confirma no diálogo
- **THEN** a tela SHALL chamar `DELETE /api/v1/produtos/:id/imagens/:imageId` na hora, sem esperar o botão de salvar, e SHALL tirar a foto da grade

#### Scenario: Exclusão de amostra publicada
- **WHEN** o usuário remove a amostra já publicada de uma variação e confirma no diálogo
- **THEN** a tela SHALL chamar `DELETE /api/v1/produtos/:id/variacoes/:variationId/amostra` na hora e SHALL voltar a variação ao estado sem amostra

#### Scenario: Desativação a partir da edição
- **WHEN** o usuário aciona "Desativar" no cabeçalho de um produto ativo e confirma no diálogo
- **THEN** a tela SHALL chamar `DELETE /api/v1/produtos/:id` e voltar para a listagem

#### Scenario: Fornecedor atual fora da listagem de ativos
- **WHEN** o fornecedor do produto não está entre os fornecedores ativos carregados no seletor
- **THEN** a tela SHALL buscá-lo por `id` e incluí-lo no seletor, para que o envio não troque o fornecedor do produto

### Requirement: Formulário em etapas
O formulário de produto SHALL mostrar uma seção por vez, com indicador de etapas e botões "Voltar" e "Próximo", e SHALL validar a etapa atual antes de avançar.

#### Scenario: Avançar com a etapa válida
- **WHEN** o usuário clica em "Próximo" e os campos da etapa atual estão válidos
- **THEN** a tela SHALL abrir a etapa seguinte e marcar a anterior como concluída no indicador

#### Scenario: Avançar com erro na etapa
- **WHEN** o usuário clica em "Próximo" com algum campo da etapa atual inválido
- **THEN** a tela SHALL permanecer na etapa, mostrar a mensagem junto ao campo e levar o foco ao primeiro campo com erro

#### Scenario: Etapas futuras bloqueadas no cadastro
- **WHEN** o usuário ainda não alcançou uma etapa
- **THEN** o indicador SHALL manter essa etapa desabilitada, e as etapas já alcançadas SHALL continuar clicáveis

#### Scenario: Salvar na última etapa
- **WHEN** o usuário aciona "Salvar produto" na última etapa e uma etapa anterior tem campo inválido
- **THEN** a tela SHALL abrir a etapa do primeiro campo com erro e não chamar a API

#### Scenario: Enter numa etapa intermediária
- **WHEN** o usuário pressiona Enter num campo de uma etapa que não é a última, no cadastro
- **THEN** a tela SHALL tratar como "Próximo" e não salvar o produto

#### Scenario: Edição com etapas livres
- **WHEN** o usuário abre a edição de um produto
- **THEN** o indicador SHALL permitir ir a qualquer etapa e o botão "Salvar alterações" SHALL aparecer em todas elas
