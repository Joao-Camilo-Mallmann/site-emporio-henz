#!/usr/bin/env python3
"""
Gera o vídeo promocional do site Empório Henz (1920x1080, 20 s, 60 fps) para as redes sociais.

O vídeo não tem locução: a história é contada por texto animado, fotos reais dos móveis
(as mesmas do seed do backend), capturas do site navegando e efeitos sonoros.

O palco é uma página HTML (scripts/promo/stage.*) animada quadro a quadro: o script chama
window.__setTime(t) para cada quadro, tira um print com o Chromium do Playwright e manda os
quadros para o ffmpeg junto com o áudio.

Uso:
  # navega no site (local ou produção), guarda as capturas e renderiza
  python scripts/generate_promo_video.py --base-url http://localhost:3000 --save-captures docs/promo/_trabalho/capturas

  # re-renderiza a partir das capturas guardadas, sem abrir o site
  python scripts/generate_promo_video.py --captures-dir docs/promo/_trabalho/capturas --music "<arquivo>"

  # abre o palco no navegador para conferir a animação sem renderizar
  python scripts/generate_promo_video.py --captures-dir docs/promo/_trabalho/capturas --preview-html docs/promo/_trabalho/palco.html

Áudio:
  - Efeitos sonoros: lidos de uma biblioteca local (--assets-dir ou PROMO_ASSETS_DIR,
    padrão D:/YT/!Assets). Arquivo ausente cai no efeito sintetizado, para o script
    continuar rodando em qualquer máquina.
  - Música: --music <arquivo> usa uma trilha real; sem ele, toca a cama sintetizada.

Detalhes, roteiro e lista de efeitos em docs/promo/README.md.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import re
import shutil
import subprocess
import tempfile
import wave
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from playwright.sync_api import sync_playwright

ROOT_DIR = Path(__file__).resolve().parent.parent
STAGE_DIR = Path(__file__).resolve().parent / "promo"
DEFAULT_OUT_MP4 = ROOT_DIR / "docs" / "promo" / "emporio-henz-promo.mp4"
DEFAULT_OUT_SRT = ROOT_DIR / "docs" / "promo" / "emporio-henz-promo.srt"
LOGO_SVG_PATH = ROOT_DIR / "frontend" / "public" / "images" / "logos" / "logo-horizontal.svg"
PUBLIC_IMAGES = ROOT_DIR / "frontend" / "public" / "images"
VARIATION_PHOTOS = ROOT_DIR / "backend" / "database" / "mock-images" / "variacoes"
PALETTE_PATH = ROOT_DIR / "shared" / "cores-moveis.json"
CONTACT_PATH = ROOT_DIR / "frontend" / "src" / "data" / "contato.json"

# Biblioteca local de áudio (não versionada). Os caminhos dos efeitos são relativos a ela.
DEFAULT_ASSETS_DIR = Path(os.environ.get("PROMO_ASSETS_DIR", "D:/YT/!Assets"))
SFX_PACK = "PACK - EFEITOS SONOROS"

DURATION = 20.0
FPS = 60
TOTAL_FRAMES = int(DURATION * FPS)
WIDTH = 1920
HEIGHT = 1080
SAMPLE_RATE = 48000
# A montagem corta no tempo de 120 BPM (uma batida a cada 0,5 s). A cama sintetizada segue o
# mesmo andamento; uma música real escolhida depois deve ter andamento parecido.
BPM = 120

# Móvel da abertura: o sofá trocando de cor no ritmo. A cor de cada acabamento vem da paleta.
HERO_PRODUCT = "sofa-retratil-e-reclinavel-veneza-3-lugares"
HERO_FINISHES = [("suede-cinza", "#8E9194"), ("linho-areia", "#D4C3A3"), ("veludo-verde-musgo", "#4E6044")]

# Textos que aparecem na tela. Entre *asteriscos* fica o destaque em azul. Os tempos são os de
# entrada e saída; o estilo e a posição de cada um ficam no palco (scripts/promo/stage.js).
TEXT_CUES = [
    {"id": "hook", "start": 0.45, "end": 3.05, "lines": ["Seu lar.", "Do seu *jeito*."]},
    {"id": "wall", "start": 3.95, "end": 5.75, "lines": ["Você escolhe.", "A gente entrega *montado*."]},
    {"id": "palette", "start": 6.05, "end": 6.75, "lines": ["Filtre por *cor*."]},
    {
        "id": "steps",
        "start": 7.90,
        "end": 12.20,
        "lines": ["Filtre por ambiente", "Veja cada detalhe", "Troque o acabamento", "Chame no WhatsApp"],
        # Instante em que cada passo acende (um pouco antes do clique correspondente).
        "at": [8.40, 9.30, 10.30, 11.15],
    },
    {"id": "history", "start": 12.65, "end": 14.60, "lines": ["Quase", "50 anos", "construindo histórias."]},
    {"id": "family", "start": 14.95, "end": 16.25, "lines": ["Um negócio de *família*,", "em Cruzeiro do Sul - RS."]},
    {"id": "end", "start": 17.15, "end": DURATION, "lines": ["Móveis para transformar o seu lar"]},
]

# Efeitos sonoros, em ordem de aparição. Cada um marca um evento que acontece na tela.
#   t        instante do evento no vídeo; o PICO do arquivo é alinhado a ele
#   peak_db  pico do efeito na mixagem, em dBFS (antes da normalização final)
#   synth    efeito sintetizado usado quando o arquivo não existe (None = fica sem som)
SFX_CLICK = f"{SFX_PACK}/General/Click - Sound Effect (HD).mp3"
SFX_PAGE = f"{SFX_PACK}/General/clean-fast-swooshaiff-14784.mp3"
SFX_SWAP = f"{SFX_PACK}/General/swish5.mp3"
SFX_SHUTTER = f"{SFX_PACK}/General/camera-shutter-6305.mp3"
SFX_CUES = [
    {"t": 0.12, "peak_db": -16.0, "synth": None, "file": f"{SFX_PACK}/Office Supplies/Hard Cover Book Close Cover 02.wav",
     "evento": "a imagem abre"},
    {"t": 1.50, "peak_db": -20.0, "synth": "whoosh", "file": SFX_SWAP, "evento": "sofá troca para linho areia"},
    {"t": 2.50, "peak_db": -20.0, "synth": "whoosh", "file": SFX_SWAP, "evento": "sofá troca para verde musgo"},
    {"t": 3.45, "peak_db": -16.0, "synth": "whoosh", "file": "Swoosh effects/2. Whoosh Swoosh.wav",
     "evento": "câmera recua e mostra a parede de móveis"},
    {"t": 6.20, "peak_db": -20.0, "synth": None, "file": f"{SFX_PACK}/Swishes/Tingly swoosh.mp3",
     "evento": "as cores da paleta surgem"},
    {"t": 7.40, "peak_db": -18.0, "synth": "whoosh", "file": SFX_PAGE, "evento": "as cores voam até o filtro do site"},
    {"t": 8.90, "peak_db": -16.0, "synth": "click", "file": SFX_CLICK, "evento": "clique no filtro Sala de Estar"},
    {"t": 9.75, "peak_db": -16.0, "synth": "click", "file": SFX_CLICK, "evento": "clique no card do produto"},
    {"t": 10.75, "peak_db": -16.0, "synth": "click", "file": SFX_CLICK, "evento": "clique na amostra de acabamento"},
    {"t": 11.60, "peak_db": -16.0, "synth": "click", "file": SFX_CLICK, "evento": "clique em Entrar em contato"},
    {"t": 11.82, "peak_db": -18.0, "synth": None, "file": f"{SFX_PACK}/General/Iphone Send.wav",
     "evento": "mensagem do WhatsApp aparece"},
    {"t": 12.50, "peak_db": -15.0, "synth": "click", "file": SFX_SHUTTER, "evento": "flash: foto da loja"},
    {"t": 14.75, "peak_db": -17.0, "synth": "click", "file": SFX_SHUTTER, "evento": "flash: foto da equipe"},
    {"t": 16.42, "peak_db": -18.0, "synth": "whoosh", "file": SFX_PAGE, "evento": "a história sobe e revela o encerramento"},
    {"t": 17.00, "peak_db": -14.0, "synth": None, "file": f"{SFX_PACK}/Swishes/Golden swish.mp3",
     "evento": "logo aparece no encerramento"},
]

# Mix final: -14 LUFS integrado, com limitador em -2,5 dBFS (o AAC devolve ~1 dB; pico real perto de -1,5).
TARGET_LUFS = -14.0
LIMITER_CEILING = 0.75

# Posições (em px do viewport de captura, 1440x900) usadas quando a medição no site falha.
CAPTURE_VIEWPORT = (1440, 900)
DEFAULT_LAYOUT = {
    "chip": {"x": 236.0, "y": 295.0},
    "card": {"x": 606.0, "y": 335.0},
    "cardRect": {"x": 473.0, "y": 202.0, "w": 267.0, "h": 425.0},
    "swatch": {"x": 921.0, "y": 332.0},
    "cta": {"x": 849.0, "y": 500.0, "w": 479.0, "h": 52.0},
    "colorSwatches": [
        {"x": 112.0, "y": 676.0, "w": 36.0, "h": 36.0},
        {"x": 158.0, "y": 676.0, "w": 36.0, "h": 36.0},
        {"x": 204.0, "y": 676.0, "w": 36.0, "h": 36.0},
        {"x": 250.0, "y": 676.0, "w": 36.0, "h": 36.0},
        {"x": 296.0, "y": 676.0, "w": 36.0, "h": 36.0},
    ],
    "product_path": "/catalogo/poltrona-decorativa-ravena",
    "product_name": "Poltrona Decorativa Ravena",
    "finish_name": "Veludo Terracota",
}

# Grupos de cor usados quando o repositório ainda não tem shared/cores-moveis.json.
FALLBACK_PALETTE = [
    {"name": "Branco", "hex": "#FAFAFA", "light": True},
    {"name": "Off-White / Bege", "hex": "#DDD2BE", "light": True},
    {"name": "Madeira Clara", "hex": "#C29B6B"},
    {"name": "Madeira Média", "hex": "#8E6743"},
    {"name": "Madeira Escura", "hex": "#4B3224"},
    {"name": "Amarelo / Dourado", "hex": "#C89635"},
    {"name": "Terracota / Rosê", "hex": "#B85941"},
    {"name": "Verde", "hex": "#4E6044"},
    {"name": "Azul", "hex": "#2D5868"},
    {"name": "Cinza", "hex": "#8E9194"},
    {"name": "Preto", "hex": "#1E1E1E"},
]

# Esconde o widget flutuante do Vue DevTools, que aparece quando o site roda em modo dev.
# Uma folha de estilo cobre também os elementos que o DevTools injeta depois do carregamento.
HIDE_DEVTOOLS_JS = """
() => {
  const css = [
    '#__vue-devtools-container__',
    '#vue-inspector-container',
    '.vue-devtools__anchor',
    'div[id*="vue-devtools"]',
    'div[class*="vue-devtools"]'
  ].join(', ') + ' { display: none !important; }';
  const apply = () => {
    if (!document.documentElement) return false;
    if (!document.getElementById('__promo_hide_devtools__')) {
      const style = document.createElement('style');
      style.id = '__promo_hide_devtools__';
      style.textContent = css;
      document.documentElement.appendChild(style);
    }
    return true;
  };
  if (!apply()) document.addEventListener('DOMContentLoaded', apply);
}
"""
# Como script de inicialização a função precisa ser chamada, não só declarada.
HIDE_DEVTOOLS_INIT = f"({HIDE_DEVTOOLS_JS.strip()})()"


def find_ffmpeg() -> str:
    return shutil.which("ffmpeg") or imageio_ffmpeg.get_ffmpeg_exe()


def find_chromium() -> str | None:
    """Procura um Chromium já baixado pelo Playwright (qualquer versão, Linux ou Windows)."""
    roots = [Path.home() / ".cache" / "ms-playwright"]
    local_app_data = os.environ.get("LOCALAPPDATA")
    if local_app_data:
        roots.append(Path(local_app_data) / "ms-playwright")
    patterns = (
        "chromium-*/chrome-linux64/chrome",
        "chromium-*/chrome-linux/chrome",
        "chromium-*/chrome-win64/chrome.exe",
        "chromium-*/chrome-win/chrome.exe",
    )
    for root in roots:
        for pattern in patterns:
            found = sorted(root.glob(pattern))
            if found:
                return str(found[-1])
    return None


# --------------------------------------------------------------------------------------------
# Capturas do site
# --------------------------------------------------------------------------------------------


def capture_file_map(cap_dir: Path) -> dict[str, Path]:
    return {
        "catalogo_all": cap_dir / "03_catalogo_all.png",
        "catalogo_sala": cap_dir / "04_catalogo_sala.png",
        "catalogo_sala_hover": cap_dir / "04_catalogo_sala_hover.png",
        "produto_var1": cap_dir / "05_produto_var1.png",
        "produto_var2": cap_dir / "05_produto_var2.png",
    }


def load_layout(cap_dir: Path) -> dict:
    layout = json.loads(json.dumps(DEFAULT_LAYOUT))
    layout_path = cap_dir / "layout.json"
    if layout_path.exists():
        layout.update(json.loads(layout_path.read_text(encoding="utf-8")))
    return layout


def capture_site_screens(base_url: str, cap_dir: Path, chromium_exec: str | None) -> tuple[dict[str, Path], dict]:
    """Navega no site, tira as capturas e mede onde ficam os elementos que aparecem em destaque."""
    cap_dir.mkdir(parents=True, exist_ok=True)
    files = capture_file_map(cap_dir)
    layout = json.loads(json.dumps(DEFAULT_LAYOUT))
    vw, vh = CAPTURE_VIEWPORT

    launch_kwargs: dict[str, object] = {"headless": True}
    if chromium_exec:
        launch_kwargs["executable_path"] = chromium_exec

    def box_of(locator) -> dict[str, float] | None:
        box = locator.bounding_box()
        if not box:
            return None
        return {"x": box["x"], "y": box["y"], "w": box["width"], "h": box["height"]}

    def center(locator) -> dict[str, float] | None:
        box = box_of(locator)
        if not box:
            return None
        return {"x": box["x"] + box["w"] / 2, "y": box["y"] + box["h"] / 2}

    with sync_playwright() as p:
        browser = p.chromium.launch(**launch_kwargs)
        ctx = browser.new_context(viewport={"width": vw, "height": vh}, device_scale_factor=2)
        ctx.add_init_script(HIDE_DEVTOOLS_INIT)
        page = ctx.new_page()

        def park_mouse() -> None:
            # Tira o mouse de cima de qualquer elemento para a captura sair sem hover.
            page.mouse.move(vw / 2, vh - 4)
            page.wait_for_timeout(350)

        page.goto(f"{base_url}/catalogo", wait_until="networkidle")
        page.wait_for_timeout(1000)
        park_mouse()
        page.screenshot(path=str(files["catalogo_all"]))
        chip = page.locator("aside").get_by_role("button", name="Sala de Estar", exact=True)
        if chip.count() > 0:
            layout["chip"] = center(chip.first) or layout["chip"]
        # Bolinhas do filtro de cor: as cores da paleta voam até elas no vídeo.
        swatches = page.locator('aside button[aria-label^="Filtrar por cor"]')
        boxes = [box_of(swatches.nth(i)) for i in range(min(5, swatches.count()))]
        if boxes and all(boxes):
            layout["colorSwatches"] = boxes

        page.goto(f"{base_url}/catalogo?categoria=sala-de-estar", wait_until="networkidle")
        page.wait_for_timeout(1000)
        park_mouse()
        page.screenshot(path=str(files["catalogo_sala"]))
        shutil.copyfile(files["catalogo_sala"], files["catalogo_sala_hover"])

        if page.locator("article").count() > 0:
            card = page.locator("article").first
            layout["cardRect"] = box_of(card) or layout["cardRect"]
            # O cursor do vídeo clica no meio da foto do produto.
            card_img = card.locator("img").first
            target = center(card_img if card_img.count() > 0 else card)
            if target:
                layout["card"] = target
                page.mouse.move(target["x"], target["y"])
                page.wait_for_timeout(450)
                page.screenshot(path=str(files["catalogo_sala_hover"]))
                page.mouse.click(target["x"], target["y"])
            else:
                card.click()
            page.wait_for_url("**/catalogo/**")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(1000)
            layout["product_path"] = page.url.replace(base_url, "", 1) or layout["product_path"]
            heading = page.locator("main h1").first
            if heading.count() > 0:
                layout["product_name"] = heading.inner_text().strip() or layout["product_name"]

            cta = page.get_by_role("button", name="Entrar em contato")
            if cta.count() == 0:
                cta = page.get_by_role("link", name="Entrar em contato")
            if cta.count() > 0:
                layout["cta"] = box_of(cta.first) or layout["cta"]

            park_mouse()
            page.screenshot(path=str(files["produto_var1"]))

            radios = page.locator('[role="radio"]')
            if radios.count() > 1:
                layout["swatch"] = center(radios.nth(1)) or layout["swatch"]
                layout["finish_name"] = (radios.nth(1).get_attribute("aria-label") or "").strip() or layout["finish_name"]
                radios.nth(1).click()
                # A galeria troca para a foto do acabamento escolhido: espera carregar e assentar.
                page.wait_for_load_state("networkidle")
                page.wait_for_timeout(900)
                park_mouse()
                page.screenshot(path=str(files["produto_var2"]))
            else:
                shutil.copyfile(files["produto_var1"], files["produto_var2"])

        browser.close()

    (cap_dir / "layout.json").write_text(json.dumps(layout, indent=2, ensure_ascii=False), encoding="utf-8")
    return files, layout


# --------------------------------------------------------------------------------------------
# Dados do palco
# --------------------------------------------------------------------------------------------


def finish_label(slug: str) -> str:
    """'veludo-verde-musgo' -> 'Veludo Verde Musgo' (com os acentos que o slug perde)."""
    accents = {"boucle": "Bouclé", "freijo": "Freijó"}
    return " ".join(accents.get(w, w.capitalize()) for w in slug.split("-"))


def load_variation_photos() -> dict[str, list[Path]]:
    """Fotos do seed agrupadas por produto: {slug do produto: [foto de cada acabamento]}."""
    products: dict[str, list[Path]] = {}
    for photo in sorted(VARIATION_PHOTOS.glob("*--*.jpg")):
        slug = photo.stem.split("--", 1)[0]
        products.setdefault(slug, []).append(photo)
    return products


def build_wall_tiles(products: dict[str, list[Path]], cols: int = 7, rows: int = 5) -> list[dict]:
    """Monta a parede de móveis. O ladrilho do centro é o sofá da abertura, com os três acabamentos."""
    center_index = (rows // 2) * cols + cols // 2
    hero = [VARIATION_PHOTOS / f"{HERO_PRODUCT}--{slug}.jpg" for slug, _ in HERO_FINISHES]
    others = [slug for slug, photos in products.items() if slug != HERO_PRODUCT and len(photos) >= 2]
    if not others:
        raise SystemExit(f"Nenhuma foto de variação encontrada em {VARIATION_PHOTOS}")

    tiles: list[dict] = []
    k = 0
    for index in range(cols * rows):
        if index == center_index:
            tiles.append({"variants": [p.as_uri() for p in hero], "hero": True})
            continue
        # Passo 5 sobre a lista evita o mesmo móvel lado a lado; na segunda volta o acabamento inverte.
        slug = others[(k * 5) % len(others)]
        a, b = products[slug][0], products[slug][1]
        if (k // len(others)) % 2 == 1:
            a, b = b, a
        tiles.append({"variants": [a.as_uri(), b.as_uri()], "hero": False})
        k += 1
    return tiles


def load_palette() -> list[dict]:
    if PALETTE_PATH.is_file():
        groups = json.loads(PALETTE_PATH.read_text(encoding="utf-8")).get("groups", [])
        if groups:
            return [{"name": g["name"], "hex": g["hex"], "light": bool(g.get("light"))} for g in groups]
    return FALLBACK_PALETTE


def load_instagram_handle() -> str:
    try:
        url = json.loads(CONTACT_PATH.read_text(encoding="utf-8")).get("instagram", "")
    except (OSError, ValueError):
        url = ""
    handle = url.rstrip("/").rsplit("/", 1)[-1] if url else "emporiohenz"
    return f"@{handle}"


def build_stage_data(captures: dict[str, Path], layout: dict) -> dict:
    products = load_variation_photos()
    hero_finishes = [{"name": finish_label(slug), "hex": hex_} for slug, hex_ in HERO_FINISHES]
    return {
        "duration": DURATION,
        "bpm": BPM,
        "captureViewport": list(CAPTURE_VIEWPORT),
        "screens": {key: path.resolve().as_uri() for key, path in captures.items()},
        "photos": {
            "showroom": (PUBLIC_IMAGES / "about" / "showroom-loja.webp").as_uri(),
            "team": (PUBLIC_IMAGES / "about" / "equipe-henz-alta.webp").as_uri(),
            "sofaCutout": (PUBLIC_IMAGES / "hero" / "hero-cutout.png").as_uri(),
        },
        "tiles": build_wall_tiles(products),
        "heroFinishes": hero_finishes,
        "palette": load_palette(),
        "layout": layout,
        "text": TEXT_CUES,
        "chat": {
            "intro": "Olá! Gostaria de mais informações:",
            "product": layout.get("product_name", DEFAULT_LAYOUT["product_name"]),
            "finish": f"Acabamento: {layout.get('finish_name', DEFAULT_LAYOUT['finish_name'])}",
        },
        "contact": {
            "instagram": load_instagram_handle(),
            "whatsapp": "Atendimento pelo WhatsApp",
            "address": "Rua General Neto, 317 · Cruzeiro do Sul - RS",
        },
        "logoSvg": LOGO_SVG_PATH.read_text(encoding="utf-8"),
    }


def build_stage_html(data: dict) -> str:
    """Junta stage.html, stage.css, stage.js e os dados num arquivo só."""
    html = (STAGE_DIR / "stage.html").read_text(encoding="utf-8")
    css = (STAGE_DIR / "stage.css").read_text(encoding="utf-8")
    js = (STAGE_DIR / "stage.js").read_text(encoding="utf-8")
    payload = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    return (
        html.replace("/*__STAGE_CSS__*/", css)
        .replace("/*__PROMO_DATA__*/", f"window.PROMO = {payload};")
        .replace("/*__STAGE_JS__*/", js)
    )


# --------------------------------------------------------------------------------------------
# Áudio
# --------------------------------------------------------------------------------------------


def decode_audio(path: Path, ffmpeg: str, start: float = 0.0, duration: float | None = None) -> np.ndarray:
    """Lê qualquer arquivo de áudio como estéreo float32 em SAMPLE_RATE."""
    cmd = [ffmpeg, "-v", "error"]
    if start > 0:
        cmd += ["-ss", f"{start:.3f}"]
    cmd += ["-i", str(path)]
    if duration is not None:
        cmd += ["-t", f"{duration:.3f}"]
    cmd += ["-f", "f32le", "-ac", "2", "-ar", str(SAMPLE_RATE), "-"]
    raw = subprocess.run(cmd, check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()


def db_to_gain(db: float) -> float:
    return 10.0 ** (db / 20.0)


def rms_db(samples: np.ndarray) -> float:
    if len(samples) == 0:
        return -120.0
    return 20.0 * math.log10(max(float(np.sqrt(np.mean(samples.astype(np.float64) ** 2))), 1e-6))


def measure_lufs(wav_path: Path, ffmpeg: str) -> float | None:
    """Loudness integrado (EBU R128) medido pelo ffmpeg."""
    proc = subprocess.run(
        [ffmpeg, "-hide_banner", "-nostats", "-i", str(wav_path), "-vn", "-af", "ebur128", "-f", "null", "-"],
        capture_output=True,
    )
    log = proc.stderr.decode("utf-8", errors="replace")
    summary = log[log.rfind("Summary:"):] if "Summary:" in log else ""
    for line in summary.splitlines():
        line = line.strip()
        if line.startswith("I:") and "LUFS" in line:
            try:
                return float(line.split()[1])
            except (IndexError, ValueError):
                return None
    return None


def write_wav_stereo(path: Path, samples: np.ndarray) -> None:
    clipped = np.clip(samples, -0.98, 0.98)
    pcm = (clipped * 32767.0).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        w.writeframes(pcm.tobytes())


def midi_to_hz(midi: float) -> float:
    return 440.0 * (2.0 ** ((midi - 69.0) / 12.0))


def synthesize_rhodes_note(freq: float, dur: float, amp: float, pan: float) -> np.ndarray:
    n = int(dur * SAMPLE_RATE)
    t = np.arange(n, dtype=np.float32) / SAMPLE_RATE
    # Envelope de piano elétrico: ataque suave, decaimento exponencial e release.
    attack = np.minimum(1.0, t / 0.014)
    decay = np.exp(-t * 1.45)
    release = np.clip((dur - t) / 0.12, 0.0, 1.0)
    env = attack * decay * release

    # Timbre de Rhodes: fundamental quente, 2º harmônico leve e um brilho curto no ataque.
    tone = (
        1.00 * np.sin(2 * np.pi * freq * t)
        + 0.24 * np.exp(-t * 2.5) * np.sin(2 * np.pi * freq * 2.0 * t)
        + 0.08 * np.exp(-t * 6.0) * np.sin(2 * np.pi * freq * 3.0 * t)
        + 0.05 * np.exp(-t * 18.0) * np.sin(2 * np.pi * freq * 7.0 * t)
    )
    mono = (tone * env * amp).astype(np.float32)
    left_g = math.cos((pan + 1.0) * math.pi / 4.0)
    right_g = math.sin((pan + 1.0) * math.pi / 4.0)
    out = np.zeros((n, 2), dtype=np.float32)
    out[:, 0] = mono * left_g
    out[:, 1] = mono * right_g
    return out


def synthesize_bass_note(freq: float, dur: float, amp: float) -> np.ndarray:
    n = int(dur * SAMPLE_RATE)
    t = np.arange(n, dtype=np.float32) / SAMPLE_RATE
    attack = np.minimum(1.0, t / 0.08)
    release = np.clip((dur - t) / 0.18, 0.0, 1.0)
    decay = np.exp(-t * 0.55)
    env = attack * decay * release
    tone = 0.85 * np.sin(2 * np.pi * freq * t) + 0.18 * np.sin(2 * np.pi * freq * 2.0 * t)
    mono = (tone * env * amp).astype(np.float32)
    out = np.zeros((n, 2), dtype=np.float32)
    out[:, 0] = mono * 0.707
    out[:, 1] = mono * 0.707
    return out


def synthesize_click(amp: float = 0.22) -> np.ndarray:
    dur = 0.045
    n = int(dur * SAMPLE_RATE)
    t = np.arange(n, dtype=np.float32) / SAMPLE_RATE
    env = np.exp(-t * 140.0)
    freq = 920.0 + 480.0 * np.exp(-t * 180.0)
    phase = 2 * np.pi * np.cumsum(freq) / SAMPLE_RATE
    mono = (np.sin(phase) * env * amp).astype(np.float32)
    out = np.zeros((n, 2), dtype=np.float32)
    out[:, 0] = mono * 0.72
    out[:, 1] = mono * 0.68
    return out


def synthesize_whoosh(rng: np.random.Generator, dur: float = 0.42, amp: float = 0.06) -> np.ndarray:
    n = int(dur * SAMPLE_RATE)
    t = np.arange(n, dtype=np.float32) / SAMPLE_RATE
    env = np.sin(np.pi * t / dur) ** 2
    noise_l = rng.normal(0.0, 1.0, n).astype(np.float32)
    noise_r = rng.normal(0.0, 1.0, n).astype(np.float32)
    # Passa-baixa simples (média móvel) para um sopro suave.
    k = 28
    kernel = np.ones(k, dtype=np.float32) / k
    smooth_l = np.convolve(noise_l, kernel, mode="same")
    smooth_r = np.convolve(noise_r, kernel, mode="same")
    out = np.zeros((n, 2), dtype=np.float32)
    out[:, 0] = smooth_l * env * amp
    out[:, 1] = smooth_r * env * amp
    return out


def place_clip(buf: np.ndarray, clip: np.ndarray, start_s: float) -> None:
    i0 = max(0, int(round(start_s * SAMPLE_RATE)))
    if i0 >= len(buf):
        return
    i1 = min(len(buf), i0 + len(clip))
    buf[i0:i1] += clip[: i1 - i0]


def prepare_sfx_clip(samples: np.ndarray) -> tuple[np.ndarray, int] | None:
    """Corta o silêncio das pontas, normaliza o pico em 1.0 e devolve (clip, índice do pico)."""
    env = np.max(np.abs(samples), axis=1) if len(samples) else np.zeros(0, dtype=np.float32)
    peak = float(env.max()) if len(env) else 0.0
    if peak <= 0.0:
        return None
    active = np.where(env > peak * db_to_gain(-45.0))[0]
    clip = samples[active[0]: active[-1] + 1] / peak
    peak_idx = int(np.argmax(np.max(np.abs(clip), axis=1)))

    # Fades curtos para não entrar nem sair seco, sem comer o ataque do efeito.
    fade_in = min(int(0.040 * SAMPLE_RATE), peak_idx // 2)
    fade_out = min(int(0.250 * SAMPLE_RATE), len(clip) // 3)
    if fade_in > 1:
        clip[:fade_in] *= np.linspace(0.0, 1.0, fade_in, dtype=np.float32)[:, None]
    if fade_out > 1:
        clip[-fade_out:] *= np.linspace(1.0, 0.0, fade_out, dtype=np.float32)[:, None]
    return clip.astype(np.float32), peak_idx


def build_sfx_track(assets_dir: Path, ffmpeg: str) -> tuple[np.ndarray, list[dict]]:
    """Monta a faixa de efeitos. O pico de cada arquivo cai no instante do evento."""
    total_samples = int(DURATION * SAMPLE_RATE)
    sfx = np.zeros((total_samples, 2), dtype=np.float32)
    rng = np.random.default_rng(42)
    cache: dict[str, tuple[np.ndarray, int] | None] = {}
    report: list[dict] = []

    for cue in SFX_CUES:
        rel = cue["file"]
        if rel not in cache:
            path = assets_dir / rel
            try:
                cache[rel] = prepare_sfx_clip(decode_audio(path, ffmpeg)) if path.is_file() else None
            except subprocess.CalledProcessError:
                cache[rel] = None
        prepared = cache[rel]

        if prepared is not None:
            clip, peak_idx = prepared
            clip = clip * db_to_gain(cue["peak_db"])
            start_s = cue["t"] - peak_idx / SAMPLE_RATE
            source = Path(rel).name
        elif cue["synth"] == "click":
            clip, start_s, source = synthesize_click(amp=db_to_gain(cue["peak_db"])), cue["t"], "sintetizado (clique)"
        elif cue["synth"] == "whoosh":
            amp = db_to_gain(cue["peak_db"]) * 0.5
            clip, start_s, source = synthesize_whoosh(rng, dur=0.40, amp=amp), cue["t"] - 0.20, "sintetizado (whoosh)"
        else:
            report.append({**cue, "source": "AUSENTE (sem som)", "rms_db": None})
            continue

        place_clip(sfx, clip, start_s)
        report.append({**cue, "source": source, "rms_db": rms_db(clip)})

    return sfx, report


def load_music_file(path: Path, ffmpeg: str, start: float, gain_db: float) -> np.ndarray:
    """Recorta DURATION segundos de uma música real e nivela pelo RMS do próprio trecho."""
    total_samples = int(DURATION * SAMPLE_RATE)
    clip = decode_audio(path, ffmpeg, start=start, duration=DURATION)
    music = np.zeros((total_samples, 2), dtype=np.float32)
    n = min(total_samples, len(clip))
    music[:n] = clip[:n]
    # Mesmo nível de partida da cama sintetizada (~-20 dBFS RMS) + ajuste pedido.
    music *= db_to_gain(-20.0 + gain_db - rms_db(clip[:n]))
    return music


def synthesize_music_bed() -> np.ndarray:
    """Cama de piano elétrico a 120 BPM: um compasso de 2 s por acorde, 10 compassos = 20 s."""
    total_samples = int(DURATION * SAMPLE_RATE)
    music = np.zeros((total_samples, 2), dtype=np.float32)
    bar = 4 * 60.0 / BPM

    cmaj9 = (48, [60, 64, 67, 71, 74], [76, 79, 74])
    am9 = (45, [57, 60, 64, 67, 71], [72, 76, 74])
    fmaj9 = (41, [53, 57, 60, 64, 67], [76, 72, 69])
    g6 = (43, [55, 59, 62, 64, 69], [74, 76, 79])
    em7 = (40, [52, 59, 62, 64, 67], [76, 74, 72])
    progression = [cmaj9, am9, fmaj9, g6, em7, am9, fmaj9, g6, cmaj9, cmaj9]

    pans = [-0.45, -0.20, 0.05, 0.28, 0.48]
    for i, (bass_midi, chord_midis, melody) in enumerate(progression):
        start_s = i * bar
        if start_s >= DURATION:
            break
        place_clip(music, synthesize_bass_note(midi_to_hz(bass_midi), bar + 0.15, amp=0.19), start_s)
        # Acorde levemente arpejado
        for idx, midi in enumerate(chord_midis):
            note = synthesize_rhodes_note(midi_to_hz(midi), bar + 0.35, amp=0.075, pan=pans[idx % len(pans)])
            place_clip(music, note, start_s + idx * 0.026)
        # Motivo agudo nas batidas 2, 3 e 4 (o último compasso só segura o acorde)
        if i < len(progression) - 1:
            for beat, m_midi in enumerate(melody, start=1):
                offset = beat * bar / 4
                plk = synthesize_rhodes_note(midi_to_hz(m_midi + 12), 1.0, amp=0.042, pan=0.22 if beat < 2 else -0.22)
                place_clip(music, plk, start_s + offset)

    # Ambiência estéreo sutil (180 ms à esquerda, 270 ms à direita)
    d_l = int(0.180 * SAMPLE_RATE)
    d_r = int(0.270 * SAMPLE_RATE)
    wet = np.zeros_like(music)
    wet[d_l:, 0] = music[:-d_l, 1] * 0.22
    wet[d_r:, 1] = music[:-d_r, 0] * 0.20
    return music + wet


def mix_soundtrack(
    ffmpeg: str,
    assets_dir: Path,
    music_file: Path | None = None,
    music_start: float = 0.0,
    music_gain_db: float = 0.0,
) -> tuple[np.ndarray, list[dict]]:
    """Música (real ou sintetizada) + efeitos sonoros."""
    total_samples = int(DURATION * SAMPLE_RATE)
    if music_file is not None:
        music = load_music_file(music_file, ffmpeg, music_start, music_gain_db)
    else:
        music = synthesize_music_bed() * db_to_gain(music_gain_db)

    # Entrada suave (0,3 s) e saída de 1 s
    t_all = np.arange(total_samples, dtype=np.float32) / SAMPLE_RATE
    fade_in = np.clip(t_all / 0.30, 0.0, 1.0)
    fade_out = np.clip((DURATION - t_all) / 1.0, 0.0, 1.0)
    music *= (fade_in * fade_out)[:, None] * 0.65

    sfx, sfx_report = build_sfx_track(assets_dir, ffmpeg)
    return music + sfx, sfx_report


# --------------------------------------------------------------------------------------------
# Legenda e render
# --------------------------------------------------------------------------------------------


def write_srt(out_srt: Path) -> None:
    """Texto que aparece na tela, em legenda avulsa (útil para acessibilidade e para a descrição)."""

    def fmt_ts(sec: float) -> str:
        ms = int(round(sec * 1000))
        h, ms = divmod(ms, 3600000)
        m, ms = divmod(ms, 60000)
        s, ms = divmod(ms, 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

    blocks = []
    for idx, cue in enumerate(TEXT_CUES, start=1):
        text = "\n".join(re.sub(r"\*([^*]+)\*", r"\1", line) for line in cue["lines"])
        blocks.append(f"{idx}\n{fmt_ts(cue['start'])} --> {fmt_ts(cue['end'])}\n{text}\n")
    out_srt.parent.mkdir(parents=True, exist_ok=True)
    out_srt.write_text("\n".join(blocks), encoding="utf-8")


def open_stage(p, html_path: Path, chromium_exec: str | None):
    launch_kwargs: dict[str, object] = {"headless": True}
    if chromium_exec:
        launch_kwargs["executable_path"] = chromium_exec
    browser = p.chromium.launch(**launch_kwargs)
    page = browser.new_page(viewport={"width": WIDTH, "height": HEIGHT})
    errors: list[str] = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(html_path.as_uri(), wait_until="networkidle")
    # Fontes carregadas e fotos decodificadas antes do primeiro quadro.
    page.evaluate("() => window.__ready")
    if errors:
        browser.close()
        raise RuntimeError("Erro no palco:\n" + "\n".join(errors))
    return browser, page


def render_video(
    html_path: Path,
    audio_wav: Path,
    out_mp4: Path,
    ffmpeg: str,
    chromium_exec: str | None,
    audio_gain_db: float = 0.0,
) -> None:
    out_mp4.parent.mkdir(parents=True, exist_ok=True)
    # Ganho para chegar em TARGET_LUFS e limitador segurando o pico (level=0: sem auto-ganho).
    audio_filter = f"volume={audio_gain_db:.2f}dB,alimiter=limit={LIMITER_CEILING}:level=0:attack=5:release=80"
    cmd = [
        ffmpeg, "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-f", "image2pipe", "-vcodec", "mjpeg", "-framerate", str(FPS), "-i", "-",
        "-i", str(audio_wav),
        "-map", "0:v:0", "-map", "1:a:0",
        "-vf", "scale=in_range=full:out_range=limited,format=yuv420p",
        "-c:v", "libx264", "-preset", "medium", "-profile:v", "high", "-crf", "16", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", str(SAMPLE_RATE), "-af", audio_filter,
        "-t", f"{DURATION:.3f}", "-movflags", "+faststart",
        str(out_mp4),
    ]

    # stderr vai para arquivo: com PIPE, o log do ffmpeg enche o buffer (pequeno no Windows)
    # e o processo trava esperando alguém ler.
    stderr_log = tempfile.TemporaryFile()
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=stderr_log)
    assert proc.stdin is not None

    with sync_playwright() as p:
        browser, page = open_stage(p, html_path, chromium_exec)
        for frame_idx in range(TOTAL_FRAMES):
            t = frame_idx / FPS
            page.evaluate(f"window.__setTime({t:.6f})")
            proc.stdin.write(page.screenshot(type="jpeg", quality=95))
            if frame_idx % 240 == 239:
                print(f"   - {frame_idx + 1}/{TOTAL_FRAMES} quadros", flush=True)
        browser.close()

    proc.stdin.close()
    ret = proc.wait()
    stderr_log.seek(0)
    stderr_out = stderr_log.read().decode("utf-8", errors="replace")
    stderr_log.close()
    if ret != 0:
        raise RuntimeError(f"FFmpeg exited with code {ret}:\n{stderr_out}")


def render_stills(html_path: Path, out_dir: Path, times: list[float], chromium_exec: str | None) -> None:
    """Tira quadros soltos do palco, para conferir a animação sem renderizar o vídeo todo."""
    out_dir.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser, page = open_stage(p, html_path, chromium_exec)
        for t in times:
            page.evaluate(f"window.__setTime({t:.6f})")
            page.screenshot(path=str(out_dir / f"t_{t:05.2f}.jpg"), type="jpeg", quality=90)
        browser.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Gera o vídeo promocional do site Empório Henz.")
    parser.add_argument("--base-url", default="http://localhost:3000", help="URL do frontend rodando.")
    parser.add_argument("--captures-dir", default="", help="Reusa capturas (e layout.json) de uma pasta, sem abrir o site.")
    parser.add_argument("--save-captures", default="", help="Navega no site e guarda as capturas nesta pasta.")
    parser.add_argument("--assets-dir", default=str(DEFAULT_ASSETS_DIR), help="Biblioteca local de efeitos sonoros.")
    parser.add_argument("--music", default="", help="Arquivo de música de fundo. Sem ele, usa a cama sintetizada.")
    parser.add_argument("--music-start", type=float, default=0.0, help="Segundo da música em que o vídeo começa.")
    parser.add_argument("--music-gain-db", type=float, default=0.0, help="Ajuste de volume da música, em dB.")
    parser.add_argument("--preview-html", default="", help="Só grava o palco neste .html (abra com #play) e sai.")
    parser.add_argument("--stills", default="", help="Só tira quadros soltos: lista de segundos, ex. 0.5,3,8.9")
    parser.add_argument("--stills-dir", default="", help="Pasta dos quadros soltos (padrão: ao lado do vídeo).")
    parser.add_argument("--out-mp4", default=str(DEFAULT_OUT_MP4))
    parser.add_argument("--out-srt", default=str(DEFAULT_OUT_SRT))
    args = parser.parse_args()

    ffmpeg = find_ffmpeg()
    chromium_exec = find_chromium()
    out_mp4 = Path(args.out_mp4).resolve()
    out_srt = Path(args.out_srt).resolve()
    assets_dir = Path(args.assets_dir)
    music_file = Path(args.music).resolve() if args.music else None
    if music_file is not None and not music_file.is_file():
        parser.error(f"Música não encontrada: {music_file}")

    with tempfile.TemporaryDirectory(prefix="emporio-promo-") as tmp:
        work_dir = Path(tmp)
        if args.captures_dir:
            cap_dir = Path(args.captures_dir).resolve()
            captures = capture_file_map(cap_dir)
            missing = [p.name for p in captures.values() if not p.is_file()]
            if missing:
                parser.error(f"Capturas ausentes em {cap_dir}: {', '.join(missing)}")
            layout = load_layout(cap_dir)
        else:
            cap_dir = Path(args.save_captures).resolve() if args.save_captures else work_dir / "captures"
            print(f"0/3 Capturando telas de {args.base_url}...")
            captures, layout = capture_site_screens(args.base_url.rstrip("/"), cap_dir, chromium_exec)
            print(f"   - produto: {layout['product_path']}")

        html = build_stage_html(build_stage_data(captures, layout))
        if args.preview_html:
            preview = Path(args.preview_html).resolve()
            preview.parent.mkdir(parents=True, exist_ok=True)
            preview.write_text(html, encoding="utf-8")
            print(f"Palco gravado em {preview} (abra no navegador com #play no fim do endereço).")
            return

        html_path = work_dir / "stage.html"
        html_path.write_text(html, encoding="utf-8")

        if args.stills:
            times = [float(x) for x in args.stills.split(",") if x.strip()]
            stills_dir = Path(args.stills_dir).resolve() if args.stills_dir else out_mp4.parent / "_quadros"
            render_stills(html_path, stills_dir, times, chromium_exec)
            print(f"{len(times)} quadros em {stills_dir}")
            return

        print("1/3 Mixando música de fundo e efeitos sonoros...")
        print(f"   - música: {music_file if music_file else f'cama sintetizada ({BPM} BPM, sem --music)'}")
        final_audio, sfx_report = mix_soundtrack(ffmpeg, assets_dir, music_file, args.music_start, args.music_gain_db)
        for item in sfx_report:
            level = "sem som" if item["rms_db"] is None else f"{item['rms_db']:.1f} dBFS RMS"
            print(f"   - {item['t']:5.2f}s  {item['evento']}: {item['source']} ({level})")

        # Grava com 6 dB de folga (sem clipar) e deixa o ganho final + limitador para o ffmpeg.
        audio_wav = work_dir / "final_mix.wav"
        write_wav_stereo(audio_wav, final_audio * 0.5)
        measured = measure_lufs(audio_wav, ffmpeg)
        audio_gain_db = float(np.clip(TARGET_LUFS - measured, -12.0, 24.0)) if measured is not None else 6.0
        if measured is not None:
            print(f"   - mix: {measured + 6.0:.1f} LUFS antes do ajuste; alvo {TARGET_LUFS:.0f} LUFS")

        write_srt(out_srt)
        print(f"2/3 Renderizando {TOTAL_FRAMES} quadros ({WIDTH}x{HEIGHT} @ {FPS}fps) via Chromium -> FFmpeg...")
        render_video(html_path, audio_wav, out_mp4, ffmpeg, chromium_exec, audio_gain_db)

    final_lufs = measure_lufs(out_mp4, ffmpeg)
    if final_lufs is not None:
        print(f"3/3 Áudio final: {final_lufs:.1f} LUFS")
    print(f"Concluído!\nVídeo: {out_mp4}\nLegenda: {out_srt}")


if __name__ == "__main__":
    main()
