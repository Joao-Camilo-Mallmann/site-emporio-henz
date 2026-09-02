# PRD · Portal Empório Henz

*Loja de móveis online e catálogo digital com solicitação de compra via WhatsApp*

*Stack: Node.js (back-end) · Vue 3 + Vite (front-end)*

---

## 1. Problema

A Empório Henz é uma loja familiar de móveis e materiais de construção em Cruzeiro do Sul, com mais de 50 anos de história. Em 2024, as enchentes destruíram o estoque físico e forçaram parte da comunidade a se mudar, afastando geograficamente a base de clientes da loja.

Quem perde com isso, e como:

- A loja tem o espaço físico reduzido e não consegue expor todo o catálogo disponível junto aos fornecedores.
- Clientes que se mudaram para outras cidades (como Lajeado) perderam contato direto com a loja e não sabem o que ela ainda oferece.
- Clientes em potencial (como Laura, consumidora final) têm receio de comprar móveis "às cegas", sem entender qualidade de material e processo de montagem.
- Profissionais como arquitetos (como Henrique) não têm uma forma prática de separar e indicar móveis por projeto para seus próprios clientes.

A loja já tem presença nas redes sociais, mas sem um catálogo estruturado que sustente esse alcance com informação de produto de verdade.

## 2. Solução

Uma plataforma web (desktop e mobile) que reúne o catálogo completo de móveis da loja e de seus fornecedores, com navegação por categoria, busca, filtros e detalhamento de produto — sem as limitações do espaço físico.

O cliente navega, filtra, compara e salva produtos de interesse em pastas compartilháveis. Quando decide comprar, entra em contato direto com a loja pelo WhatsApp — o atendimento próximo e pessoal continua sendo o diferencial da Empório Henz, só que agora com um catálogo por trás dele.

A administração da loja usa o mesmo sistema, com login próprio, para cadastrar e manter os produtos, fornecedores e categorias — inclusive em um tablet dentro da loja física, durante o atendimento presencial.

## 3. Escopo

O sistema é construído em partes, na ordem abaixo. As primeiras fazem o catálogo existir e ser navegável. As últimas dependem de já haver produto cadastrado e cliente navegando.

| Ordem | Parte | Por que nesta posição |
|---|---|---|
| 1 | Login da loja (admin) e cadastro de produto/categoria/fornecedor | sem produto cadastrado não há o que mostrar |
| 2 | Catálogo público: navegação, busca e filtros | é a tela que resolve o problema do cliente final |
| 3 | Página de detalhe do produto | é onde o cliente decide se confia no material e na montagem |
| 4 | Login do cliente e salvamento de produtos em pastas | resolve o receio de "comparar tudo" e permite retomar depois |
| 5 | Compartilhamento de pasta (ex.: arquiteto → cliente final) | atende ao caso de uso do Henrique, que separa móveis por projeto |
| 6 | Botão de contato via WhatsApp a partir do produto/pasta | é o que fecha o ciclo até a venda, fora do sistema |
| 7 | Painel administrativo de produtos (CRUD completo) | só faz sentido depois que o catálogo público já está no ar |
| 8 | Recomendações personalizadas | número que só existe depois de haver histórico de navegação |

## 4. Requisitos funcionais

| ID | Requisito |
|---|---|
| RF01 | O sistema permite que o administrador da loja acesse com e-mail e senha |
| RF02 | O sistema permite que o administrador cadastre, edite e remova produtos (nome, categoria, preço, prazo, fotos e variações de acabamento), com um único campo de texto livre para descrição, onde entram características, dimensões, marca, linha, material, composição e ferragens, para facilitar o cadastro |
| RF03 | O sistema permite que o administrador cadastre fornecedores e associe produtos a eles |
| RF04 | O sistema exibe ao cliente o catálogo de produtos organizado por categoria (Quarto, Sala de Estar, Sala de Jantar, Cozinha, Escritório, Banheiro) |
| RF05 | O sistema permite ao cliente buscar produtos por texto e aplicar filtros por categoria, cor, material, preço e marca/fornecedor |
| RF06 | O sistema exibe a página de detalhe do produto, com carrossel de fotos, variações de acabamento, valor com parcelamento, prazo de entrega, informação de montagem, e a descrição em texto livre (características, dimensões, marca, linha, material, composição e ferragens) |
| RF07 | O sistema permite que o cliente crie uma conta e acesse com e-mail e senha |
| RF08 | O sistema permite ao cliente criar, nomear, editar e excluir pastas, e salvar produtos nelas (o cliente já começa com uma pasta padrão, "Favoritos") |
| RF09 | O sistema permite ao cliente gerar um link compartilhável de uma pasta salva; qualquer pessoa com o link (incluindo a loja) acessa a pasta em modo leitura, sem permissão especial de administrador |
| RF10 | O sistema exibe um botão de contato via WhatsApp na página do produto e na pasta, com mensagem pré-preenchida indicando o(s) produto(s) |
| RF11 | O sistema exibe informações institucionais da loja (sobre a loja, endereço, contato) |
| RF12 | O sistema recomenda produtos ao cliente com base em categorias e produtos visualizados/salvos anteriormente |

## 5. Requisitos não funcionais

| ID | Requisito | Como se verifica |
|---|---|---|
| RNF01 | O catálogo com filtros aplicados carrega em até 2s com 500 produtos cadastrados | medição no navegador com base de teste |
| RNF02 | Imagens de produto são otimizadas e carregam de forma progressiva (lazy load) | inspeção de rede no navegador em conexão 4G simulada |
| RNF03 | Senhas são armazenadas com hash, nunca em texto puro | inspeção da tabela de usuários |
| RNF04 | Um cliente (incluindo a própria loja/admin) nunca acessa a pasta salva de outro cliente sem o link de compartilhamento — não existe permissão de administrador que ignore essa regra | tentativa de acesso direto por URL com sessão de outro usuário, inclusive de admin |
| RNF05 | A interface é utilizável em tela de 360px de largura | teste no navegador em viewport de celular |
| RNF06 | O sistema roda em navegador atual, sem plugin | Chrome e Firefox em versão corrente |
| RNF07 | A API responde ao front em formato JSON, versionada (ex.: /api/v1) | inspeção das rotas do back-end Node.js |

O RNF04 é o requisito crítico do sistema: se ele falhar, uma pasta de um cliente (com preferências e possivelmente um projeto de um arquiteto) fica exposta a terceiros sem consentimento.

## 6. Histórias de usuário

1. Como consumidora final, quero navegar pelo catálogo completo da loja, para conhecer produtos que não cabem no espaço físico.
2. Como consumidora final, quero ver detalhes de material e acabamento de cada produto, para perder o receio de comprar móveis sem ver pessoalmente.
3. Como consumidora final, quero comparar produtos por tamanho, cor e preço, para escolher o melhor custo-benefício.
4. Como consumidora final, quero salvar produtos que gostei, para retomar a decisão depois sem perder o que já vi.
5. Como arquiteto, quero separar móveis por projeto em pastas, para indicar aos meus clientes os móveis certos para cada ambiente.
6. Como arquiteto, quero compartilhar uma pasta de produtos com meu cliente, para ele ver exatamente o que eu recomendei.
7. Como cliente (final ou arquiteto), quero falar diretamente com a loja pelo WhatsApp a partir de um produto, para fechar a compra com o atendimento pessoal que já confio.
8. Como administradora da loja, quero cadastrar e editar produtos e fornecedores, para manter o catálogo atualizado sem depender de terceiros.
9. Como administradora da loja, quero usar o mesmo sistema em um tablet na loja física, para mostrar o catálogo completo durante o atendimento presencial.

## 7. Casos de uso

### Atores

| Ator | Quem é |
|---|---|
| Cliente | consumidor final ou profissional (arquiteto) que navega e compra móveis |
| Loja | a administração da Empório Henz, que mantém o catálogo |
| Recomendador | o próprio sistema, ao sugerir produtos |

### Casos de uso e rastreabilidade

| Caso de uso | Vem da história | Realiza |
|---|---|---|
| UC01 · Entrar no portal (cliente) | nenhuma; é pré-requisito de UC03 a UC06 | RF07 |
| UC02 · Ver catálogo por categoria | 1 | RF04 |
| UC03 · Buscar e filtrar produtos | 3 | RF05 |
| UC04 · Ver detalhe do produto | 2 | RF06 |
| UC05 · Gerenciar pastas e salvar produto | 4 | RF08 |
| UC06 · Compartilhar pasta | 6 | RF09 |
| UC07 · Contatar a loja via WhatsApp | 7 | RF10 |
| UC08 · Gerenciar produtos e fornecedores | 8 | RF01, RF02, RF03 |
| UC09 · Ver produtos recomendados | nenhuma; é enriquecimento de UC02 | RF12 |

### Diagrama de casos de uso

> `[ inserir aqui o diagrama de casos de uso ]`

Os nove casos ficam dentro da fronteira do sistema e os dois atores fora dela, ligados aos casos que disparam. Duas ligações merecem atenção:

- UC07 inclui a geração da mensagem pré-preenchida a partir de UC04 ou UC06 — contatar a loja não é um caso isolado, é a saída natural de quem já viu ou salvou um produto.
- UC09 estende UC02: a recomendação aparece dentro da navegação do catálogo, sem que o cliente precise disparar um caso à parte.

### UC05 · Gerenciar pastas e salvar produto

| Campo | Conteúdo |
|---|---|
| Ator principal | Cliente |
| Pré-condição | cliente autenticado; possui ao menos a pasta padrão "Favoritos" |
| Disparo | o cliente cria uma pasta nova, ou clica em salvar a partir da página de detalhe do produto |
| Requisitos ligados | RF08, RNF04 |

Fluxo principal:

1. O cliente acessa a área "Salvos" e vê suas pastas existentes (com a pasta padrão "Favoritos" sempre presente).
2. Pode criar uma pasta nova, dando um nome a ela, ou escolher uma pasta já existente.
3. A partir da página de detalhe do produto, clica em salvar e escolhe a pasta de destino.
4. O sistema associa o produto à pasta do cliente autenticado.
5. O cliente pode renomear ou excluir qualquer pasta (exceto a padrão, que não pode ser excluída) pelo menu de opções do card.

Fluxos alternativos:

- A1, cliente sem conta: o sistema convida o cliente a criar conta antes de salvar, sem perder o produto que estava vendo.
- A2, exclusão de pasta com itens: o sistema pede confirmação antes de excluir uma pasta que ainda tem produtos salvos.
- A3, tentativa de excluir a pasta padrão "Favoritos": o sistema não permite; o cliente pode esvaziá-la, mas ela sempre existe.

Pós-condição: o produto aparece na pasta escolhida do cliente e é recuperável em qualquer acesso futuro; a lista de pastas reflete criações, edições e exclusões imediatamente.

*UC07 e UC08 têm regra própria e são detalhados no mesmo formato. Os casos sem regra, como UC01 e UC02, ficam só no diagrama.*

## 8. Modelagem

O sistema tem seis conceitos, os mesmos do glossário da seção 12. Abaixo eles aparecem em duas notações: como classes, com comportamento, e como tabelas, com chaves.

### 8.1 Diagrama de classes

> `[ inserir aqui o diagrama de classes ]`

### 8.2 Modelo de dados

> `[ inserir aqui o modelo de dados ]`

## 9. Decisões de implementação

- Back-end em Node.js expõe uma API REST (JSON) consumida pelo front; toda regra de negócio e autorização vivem no back-end, nunca só no front.
- Front-end em Vue 3 com Vite, organizado em componentes reutilizáveis (card de produto, filtro, pasta) e roteamento via Vue Router.
- Autorização é sempre verificada no servidor. Esconder um botão de admin no front não é controle de acesso (ver RNF04).
- As imagens de produto vão para armazenamento de objetos (ex.: bucket S3-compatível), e o banco guarda caminho e metadados, seguindo o mesmo princípio do modelo de referência.
- O link de contato via WhatsApp é gerado com uma URL padrão (wa.me) e mensagem pré-preenchida contendo nome e link do(s) produto(s) — não há integração de API paga com WhatsApp.
- O compartilhamento de pasta usa um identificador público (slug ou UUID) que não expõe o e-mail nem a conta do dono da pasta.
- A loja não tem um papel de "administrador" com acesso irrestrito às pastas dos clientes. Quando o cliente compartilha o link de uma pasta com a loja (para pedir ajuda ou fechar uma compra), a loja acessa exatamente como qualquer outro destinatário do link, em modo leitura — não existe uma tela de admin que liste pastas de todos os clientes.
- A descrição do produto (características, dimensões, marca, linha, material, composição, ferragens) é armazenada como um único campo de texto livre, para simplificar o formulário de cadastro da loja. Isso significa que o filtro de material e marca em RF05 depende de campos próprios e independentes (não extraídos da descrição), já que o texto livre não é uma fonte confiável para filtro estruturado.

## 10. Decisões de teste

Os testes verificam comportamento externo, e estes precisam existir:

- Um cliente não enxerga a pasta salva de outro cliente sem o link (RNF04). É o teste mais importante do sistema.
- Busca e filtros combinados retornam apenas produtos que atendem a todos os critérios simultaneamente (RF05).
- Cadastro de produto sem campos obrigatórios (nome, categoria, preço) é rejeitado pela API (RF02).
- Link de pasta compartilhada abre em modo leitura para quem não é o dono, mesmo autenticado com outra conta (RF09, RNF04).
- Catálogo com 500 produtos cadastrados carrega dentro do limite de 2s (RNF01).
- Botão de WhatsApp gera a URL correta com o nome do produto na mensagem (RF10).

## 11. Fora de escopo

- Checkout e pagamento dentro do sistema — a compra é fechada via WhatsApp com a loja.
- Integração com sistema de estoque ou ERP que a loja já usa.
- Emissão de nota fiscal ou qualquer documento fiscal.
- Aplicativo nativo. O portal é web e responsivo (RNF05).
- Agendamento de entrega ou montagem dentro do sistema.
- Gestão de redes sociais ou automação de posts (tratada à parte, fora do sistema).

## 12. Glossário

| Termo | Significado neste projeto |
|---|---|
| Cliente | O consumidor final ou profissional (arquiteto) que navega e compra móveis |
| Loja | A Empório Henz: a administração que cadastra e mantém o catálogo |
| Produto | Um item de móvel ou material do catálogo, com categoria, fornecedor e preço |
| Fornecedor | A marca ou parceiro que fabrica/fornece um produto do catálogo |
| Pasta | Um agrupamento de produtos salvos por um cliente, compartilhável por link |
| Categoria | O tipo de ambiente ao qual o produto pertence (Quarto, Cozinha, etc.) |