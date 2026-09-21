# pagina-sobre-a-loja Specification

## Purpose
Disponibilizar a página institucional "Sobre a Loja" com a história da Empório Henz, fotos da equipe/showroom, proposta de valor e informações completas para contato e visitação física.

## Requirements

### Requirement: Rota e Navegação Institucional Sobre a Loja
O sistema frontend SHALL disponibilizar a rota `/sobre-a-loja`, acessível tanto via links da barra de navegação superior (desktop e drawer mobile) quanto pelo rodapé institucional.

#### Scenario: Acesso via URL direta
- **WHEN** o usuário acessar a URL `/sobre-a-loja` no navegador
- **THEN** o sistema SHALL renderizar a página institucional "Sobre a Loja" com título de página atualizado para "Sobre a Loja | Empório Henz".

#### Scenario: Clique em links institucionais na Navbar ou Footer
- **WHEN** o usuário clicar no link "Sobre a loja" presente no cabeçalho desktop, no drawer lateral mobile ou no rodapé
- **THEN** a aplicação SHALL navegar para a rota `/sobre-a-loja` sem recarregar a página inteira (SPA).

### Requirement: Seção Hero Institucional e Navegação de Retorno
A página Sobre a Loja SHALL exibir no topo um Hero Banner com imagem de fundo do showroom da loja física em tom azulado sobreposto (`bg-primary/80` ou gradiente de overlay), a logo horizontal branca do Empório Henz e o texto de destaque comemorativo "Há quase 50 ANOS CONSTRUINDO HISTÓRIAS", além de um botão de voltar para a página anterior/home.

#### Scenario: Visualização do Hero em telas Mobile e Desktop
- **WHEN** o usuário visualizar o Hero institucional em qualquer tamanho de viewport (mobile ou desktop)
- **THEN** a imagem de fundo com overlay azul marinho SHALL cobrir o cabeçalho do bloco, exibindo nitidamente a marca Empório Henz e o texto "Há quase 50 ANOS CONSTRUINDO HISTÓRIAS".

#### Scenario: Interação com botão de voltar
- **WHEN** o usuário clicar no botão de voltar (ícone de seta à esquerda) no Hero
- **THEN** o sistema SHALL retornar para a rota anterior ou para a página inicial `/`.

### Requirement: Seção de História da Marca e Filosofia do Negócio
A página Sobre a Loja SHALL apresentar o conteúdo editorial e textual da marca sob o título principal "Empório Henz: Onde a sua história encontra o seu lugar", detalhando a origem familiar em Cruzeiro do Sul, as quase cinco décadas de tradição e o modelo híbrido de catálogo digital e compra na loja física.

#### Scenario: Leitura da história e proposta de valor
- **WHEN** o usuário rolar a página para a seção de conteúdo textual
- **THEN** o sistema SHALL exibir a tipografia serifada/moderna institucional nas cores do design system (`text-neutral-dark`), detalhando os dois parágrafos oficiais sobre a história e a experiência de compra acolhedora.

### Requirement: Carrossel/Galeria de Fotos da Equipe e Loja Física
A página Sobre a Loja SHALL conter um componente visual de galeria/carrossel responsivo com as fotos da equipe fundadora e do espaço físico da loja, permitindo navegação entre fotos por botões de avançar/voltar ou arraste.

#### Scenario: Navegação entre fotos da loja
- **WHEN** o usuário clicar nos botões de controle de slide (setas esquerda e direita na parte inferior da foto)
- **THEN** o carrossel SHALL alternar suavemente a foto exibida para a imagem anterior ou posterior com transição fluida.

### Requirement: Design System e Responsividade Rigorosa
Todos os elementos da página Sobre a Loja SHALL aderir estritamente às classes utilitárias do Tailwind v4 (`primary`, `primary-dark`, `secondary`, `neutral-dark`, `surface-light`, `surface-tint`), proibindo o uso de hexadecimais inline arbitrários, com layout fluido e adaptado para dispositivos móveis (< 768px) e desktop (>= 768px).

#### Scenario: Renderização consistente em múltiplos viewports
- **WHEN** a página for renderizada em larguras de tela de smartphones (ex: 375px) até monitores desktop (ex: 1280px+)
- **THEN** o Hero, os textos e a galeria SHALL se ajustar sem quebras horizontais de layout ou overflow indesejado.
