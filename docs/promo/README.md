gi# Vídeo promocional do site

Vídeo de 20 s (1920x1080, 60 fps, sem locução) para divulgar o catálogo online nas redes da loja. Mostra os
móveis trocando de acabamento, a paleta de cores, o site em uso e a história da loja.

| Arquivo | O que é |
| --- | --- |
| `emporio-henz-promo.mp4` | Vídeo final: texto animado, fotos, capturas do site, música de fundo e efeitos sonoros |
| `emporio-henz-promo.srt` | O texto que aparece na tela, em legenda avulsa, com os mesmos tempos |
| `_trabalho/` | Capturas do site e arquivos de trabalho. Não vai para o Git |

Nada é editado à mão. [`scripts/generate_promo_video.py`](../../scripts/generate_promo_video.py) navega no
site, tira as capturas, mixa o áudio e renderiza o palco quadro a quadro. O palco (o que aparece na tela e
como se move) fica em [`scripts/promo/`](../../scripts/promo/): `stage.html`, `stage.css` e `stage.js`.

## Como gerar de novo

Dependências Python: `playwright`, `numpy` e `imageio-ffmpeg`. Precisa também do `ffmpeg` e de um Chromium do
Playwright (`playwright install chromium`).

```bash
# 1. Navega no site e guarda as capturas (use a URL do ambiente que quer mostrar)
python scripts/generate_promo_video.py --base-url http://localhost:3000 --save-captures docs/promo/_trabalho/capturas

# 2. Re-renderiza a partir das capturas guardadas, sem abrir o site (para mexer só em som ou animação)
python scripts/generate_promo_video.py --captures-dir docs/promo/_trabalho/capturas

# Conferir a animação sem renderizar: quadros soltos ou o palco tocando no navegador
python scripts/generate_promo_video.py --captures-dir docs/promo/_trabalho/capturas --stills 1.5,8.9,17
python scripts/generate_promo_video.py --captures-dir docs/promo/_trabalho/capturas --preview-html docs/promo/_trabalho/palco.html
```

O `palco.html` abre no navegador: com `#play` no fim do endereço ele toca em loop; com `#t=8.9`, congela
naquele segundo.

O site mudou (produtos, layout)? Rode o passo 1 de novo. As posições que aparecem em destaque (bolinhas do
filtro de cor, filtro "Sala de Estar", card do produto, amostra de acabamento, botão "Entrar em contato") são
medidas na hora da captura e gravadas em `capturas/layout.json`, então a animação acompanha o layout atual.

De onde vem cada imagem:

- **Móveis**: as fotos de variação do seed (`backend/database/mock-images/variacoes/`).
- **Site**: o primeiro produto do catálogo filtrado por Sala de Estar e a troca para o segundo acabamento.
  As variações precisam ter foto (o `bun run seed` do backend envia as dos produtos de exemplo).
- **Paleta**: os grupos de cor de `shared/cores-moveis.json`.
- **Loja e equipe**: `frontend/public/images/about/`. O sofá do encerramento é `hero/hero-cutout.png`.
- **Instagram**: `frontend/src/data/contato.json`.

## Roteiro

A montagem corta no tempo de 120 BPM (uma batida a cada 0,5 s).

| Tempo | Cena | Texto na tela |
| --- | --- | --- |
| 0,0 a 3,2 s | Sofá em tela cheia troca de cor na batida (cinza, areia, verde), com as amostras do tecido | "Seu lar. Do seu jeito." |
| 3,2 a 6,0 s | A câmera recua e revela uma parede com os móveis do catálogo, cada um trocando de acabamento | "Você escolhe. A gente entrega montado." |
| 6,0 a 7,6 s | As cores da paleta surgem e voam até as bolinhas do filtro "Cor" do site | "Filtre por cor." |
| 7,6 a 12,5 s | O site: filtro Sala de Estar, card do produto, troca de acabamento e "Entrar em contato", com a mensagem do WhatsApp | Os quatro passos, ao lado do navegador |
| 12,5 a 16,5 s | Flash: foto da loja com o contador até 50 anos; flash: foto da equipe | "Quase 50 anos construindo histórias." / "Um negócio de família, em Cruzeiro do Sul - RS." |
| 16,5 a 20,0 s | Encerramento: sofá, logo, slogan, Instagram, WhatsApp e endereço | "Móveis para transformar o seu lar" |

Os textos ficam em `TEXT_CUES`, no topo do script; entre `*asteriscos*` fica a palavra em destaque.

## Efeitos sonoros

Cada efeito marca um evento que acontece na tela; texto entrando não tem som. A lista fica em `SFX_CUES`, no
topo do script, e o pico de cada arquivo é alinhado ao instante do evento.

| Tempo | Evento na tela | Arquivo |
| --- | --- | --- |
| 0,12 s | A imagem abre | `PACK - EFEITOS SONOROS/Office Supplies/Hard Cover Book Close Cover 02.wav` |
| 1,50 s e 2,50 s | O sofá troca de cor | `PACK - EFEITOS SONOROS/General/swish5.mp3` |
| 3,45 s | A câmera recua e mostra a parede de móveis | `Swoosh effects/2. Whoosh Swoosh.wav` |
| 6,20 s | As cores da paleta surgem | `PACK - EFEITOS SONOROS/Swishes/Tingly swoosh.mp3` |
| 7,40 s | As cores voam até o filtro do site | `PACK - EFEITOS SONOROS/General/clean-fast-swooshaiff-14784.mp3` |
| 8,90, 9,75, 10,75 e 11,60 s | Cliques no site | `PACK - EFEITOS SONOROS/General/Click - Sound Effect (HD).mp3` |
| 11,82 s | A mensagem do WhatsApp aparece | `PACK - EFEITOS SONOROS/General/Iphone Send.wav` |
| 12,50 s e 14,75 s | Flash das fotos da loja e da equipe | `PACK - EFEITOS SONOROS/General/camera-shutter-6305.mp3` |
| 16,42 s | A história sobe e revela o encerramento | `PACK - EFEITOS SONOROS/General/clean-fast-swooshaiff-14784.mp3` |
| 17,00 s | A logo aparece | `PACK - EFEITOS SONOROS/Swishes/Golden swish.mp3` |

Os arquivos vêm de uma biblioteca local que **não está no repositório** (o repositório é público e os sons
são de terceiros). O caminho padrão é `D:/YT/!Assets`; para outro lugar, use `--assets-dir` ou a variável
`PROMO_ASSETS_DIR`. Se um arquivo não existir, o script usa um clique ou whoosh sintetizado no lugar (ou deixa
o evento sem som) e avisa no log, então o vídeo ainda é gerado em qualquer máquina.

## Música

A trilha escolhida é **"Happy Motion", de MUSIC4VIDEO (2BStudio)**, a cerca de 120 BPM, começando aos 9,28 s
da música (o ponto em que os ataques mais coincidem com os cortes):

```bash
python scripts/generate_promo_video.py --captures-dir docs/promo/_trabalho/capturas \
  --music "<arquivo da Happy Motion>.mp3" --music-start 9.28
```

> [!WARNING]
> A "Happy Motion" é paga: é vendida no AudioJungle/Envato e está no Content ID. Por isso o
> `emporio-henz-promo.mp4` versionado (o repositório é público) sai com a cama sintetizada. A versão com a
> Happy Motion fica em `_trabalho/emporio-henz-promo-happy-motion.mp4`, fora do Git, feita com o áudio do
> YouTube só como prévia. Antes de postar, compre a licença (link na descrição do vídeo dela no YouTube) e
> renderize de novo com o MP3 da compra.

Sem `--music`, o script toca uma cama de piano elétrico sintetizada, a 120 BPM.

- `--music-start`: segundo da música em que o vídeo começa. Serve para pular a introdução.
- `--music-gain-db`: sobe ou desce a música em relação aos efeitos.

Antes de escolher a música, confira a licença para uso comercial e fora do YouTube: o vídeo é de um cliente e
vai para o Instagram. As músicas do canal Infraction exigem assinatura do inaudio para esse uso.

## Mixagem

O áudio final é ajustado para -14 LUFS, com limitador segurando o pico perto de -1,5 dBFS. O log do script
mostra o nível de cada efeito e do arquivo final.
