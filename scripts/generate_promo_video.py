#!/usr/bin/env python3
"""
Gera o vídeo promocional do site Empório Henz (1080p, <= 15s, com leve motion,
locução em português, trilha sonora ambiente e legendas sincronizadas).

Uso:
  python scripts/generate_promo_video.py
"""

from __future__ import annotations

import argparse
import asyncio
import base64
import math
import os
import shutil
import subprocess
import tempfile
import wave
from pathlib import Path

import edge_tts
import imageio_ffmpeg
import numpy as np
from playwright.sync_api import sync_playwright

ROOT_DIR = Path(__file__).resolve().parent.parent
DEFAULT_OUT_MP4 = ROOT_DIR / "docs" / "promo" / "emporio-henz-promo.mp4"
DEFAULT_OUT_SRT = ROOT_DIR / "docs" / "promo" / "emporio-henz-promo.srt"
LOGO_SVG_PATH = ROOT_DIR / "frontend" / "public" / "images" / "logos" / "logo-horizontal.svg"

DURATION = 15.0
FPS = 60
TOTAL_FRAMES = int(DURATION * FPS)
WIDTH = 1920
HEIGHT = 1080
SAMPLE_RATE = 48000

VOICE_NAME = "pt-BR-FranciscaNeural"

NARRATION_CUES = [
    {
        "id": "cue1",
        "start": 0.30,
        "rate": "+10%",
        "spoken": "Transforme o seu lar com o catálogo da Empório Henz.",
        "subtitle_html": 'Transforme o seu lar com o<br><span class="hl">catálogo da Empório Henz</span>',
        "srt_text": "Transforme o seu lar com o\ncatálogo da Empório Henz",
        "sub_start": 0.20,
        "sub_end": 3.15,
    },
    {
        "id": "cue2",
        "start": 3.45,
        "rate": "+10%",
        "spoken": "Explore por ambiente, filtre pronta entrega ou sob encomenda.",
        "subtitle_html": 'Explore por ambiente, filtre<br><span class="hl">pronta entrega ou sob encomenda</span>',
        "srt_text": "Explore por ambiente, filtre\npronta entrega ou sob encomenda",
        "sub_start": 3.35,
        "sub_end": 7.15,
    },
    {
        "id": "cue3",
        "start": 7.45,
        "rate": "+10%",
        "spoken": "Escolha os acabamentos, salve favoritos e chame no WhatsApp.",
        "subtitle_html": 'Escolha acabamentos, salve<br><span class="hl">favoritos e chame no WhatsApp</span>',
        "srt_text": "Escolha acabamentos, salve\nfavoritos e chame no WhatsApp",
        "sub_start": 7.35,
        "sub_end": 11.20,
    },
    {
        "id": "cue4",
        "start": 11.40,
        "rate": "+12%",
        "spoken": "Quase cinquenta anos construindo histórias. Empório Henz!",
        "subtitle_html": 'Quase <span class="hl">50 anos</span> construindo histórias.<br>Empório Henz!',
        "srt_text": "Quase 50 anos construindo histórias.\nEmpório Henz!",
        "sub_start": 11.30,
        "sub_end": 14.85,
    },
]

HIDE_DEVTOOLS_JS = """
() => {
  const hide = () => {
    const selectors = [
      '#__vue-devtools-container__',
      '.vue-devtools__anchor',
      '#vue-inspector-container',
      'div[id*="vue-devtools"]',
      'div[class*="vue-devtools"]'
    ];
    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach(el => {
        el.style.setProperty('display', 'none', 'important');
      });
    }
  };
  hide();
  new MutationObserver(hide).observe(document.documentElement, { childList: true, subtree: true });
}
"""


def find_ffmpeg() -> str:
    return shutil.which("ffmpeg") or imageio_ffmpeg.get_ffmpeg_exe()


def find_chromium() -> str | None:
    candidates = [
        Path.home() / ".cache/ms-playwright/chromium-1254/chrome-linux64/chrome",
        Path.home() / ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome",
    ]
    for path in candidates:
        if path.exists():
            return str(path)
    return None


def capture_site_screens(base_url: str, cap_dir: Path, chromium_exec: str | None) -> dict[str, Path]:
    cap_dir.mkdir(parents=True, exist_ok=True)
    files = {
        "home_full": cap_dir / "01_home_full.png",
        "catalogo_all": cap_dir / "03_catalogo_all.png",
        "catalogo_sala": cap_dir / "04_catalogo_sala.png",
        "produto_var1": cap_dir / "05_produto_var1.png",
        "produto_var2": cap_dir / "05_produto_var2.png",
        "sobre": cap_dir / "06_sobre.png",
        "mobile_catalogo": cap_dir / "08_mobile_catalogo.png",
    }

    launch_kwargs: dict[str, object] = {"headless": True}
    if chromium_exec:
        launch_kwargs["executable_path"] = chromium_exec

    with sync_playwright() as p:
        browser = p.chromium.launch(**launch_kwargs)
        ctx = browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=2)
        ctx.add_init_script(HIDE_DEVTOOLS_JS)
        page = ctx.new_page()

        page.goto(f"{base_url}/", wait_until="networkidle")
        page.wait_for_timeout(1200)
        page.evaluate(HIDE_DEVTOOLS_JS)
        page.screenshot(path=str(files["home_full"]), full_page=True)

        page.goto(f"{base_url}/catalogo", wait_until="networkidle")
        page.wait_for_timeout(1000)
        page.evaluate(HIDE_DEVTOOLS_JS)
        page.screenshot(path=str(files["catalogo_all"]))

        page.goto(f"{base_url}/catalogo?categoria=sala-de-estar", wait_until="networkidle")
        page.wait_for_timeout(1000)
        page.evaluate(HIDE_DEVTOOLS_JS)
        page.screenshot(path=str(files["catalogo_sala"]))

        if page.locator("article").count() > 0:
            page.locator("article").first.click()
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(1000)
            page.evaluate(HIDE_DEVTOOLS_JS)
            page.screenshot(path=str(files["produto_var1"]))

            radios = page.locator('[role="radio"]')
            if radios.count() > 1:
                radios.nth(1).click()
                page.wait_for_timeout(500)
                page.screenshot(path=str(files["produto_var2"]))
            else:
                shutil.copyfile(files["produto_var1"], files["produto_var2"])

        page.goto(f"{base_url}/sobre-a-loja", wait_until="networkidle")
        page.wait_for_timeout(1000)
        page.evaluate(HIDE_DEVTOOLS_JS)
        page.screenshot(path=str(files["sobre"]))

        mctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        mctx.add_init_script(HIDE_DEVTOOLS_JS)
        mpage = mctx.new_page()
        mpage.goto(f"{base_url}/catalogo?categoria=sala-de-estar", wait_until="networkidle")
        mpage.wait_for_timeout(1000)
        mpage.evaluate(HIDE_DEVTOOLS_JS)
        mpage.screenshot(path=str(files["mobile_catalogo"]))

        browser.close()
    return files


def read_wav_stereo(path: Path) -> np.ndarray:
    with wave.open(str(path), "rb") as w:
        assert w.getframerate() == SAMPLE_RATE
        assert w.getnchannels() == 2
        frames = w.readframes(w.getnframes())
    data = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
    return data.reshape(-1, 2)


def write_wav_stereo(path: Path, samples: np.ndarray) -> None:
    clipped = np.clip(samples, -0.98, 0.98)
    pcm = (clipped * 32767.0).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        w.writeframes(pcm.tobytes())


async def synthesize_voiceover(work_dir: Path, ffmpeg: str) -> tuple[np.ndarray, list[tuple[float, float]]]:
    work_dir.mkdir(parents=True, exist_ok=True)
    total_samples = int(DURATION * SAMPLE_RATE)
    vo_mix = np.zeros((total_samples, 2), dtype=np.float32)
    actual_spans: list[tuple[float, float]] = []

    for cue in NARRATION_CUES:
        mp3_path = work_dir / f"{cue['id']}.mp3"
        wav_path = work_dir / f"{cue['id']}.wav"
        comm = edge_tts.Communicate(cue["spoken"], VOICE_NAME, rate=cue["rate"])
        await comm.save(str(mp3_path))

        # Trim silence and apply warm vocal EQ + light compression
        subprocess.run(
            [
                ffmpeg,
                "-y",
                "-i",
                str(mp3_path),
                "-af",
                (
                    "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,"
                    "areverse,"
                    "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,"
                    "areverse,"
                    "highpass=f=85,"
                    "equalizer=f=3200:t=q:w=1.2:g=2.5,"
                    "acompressor=threshold=-18dB:ratio=2.5:attack=10:release=120"
                ),
                "-ar",
                str(SAMPLE_RATE),
                "-ac",
                "2",
                str(wav_path),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        clip = read_wav_stereo(wav_path)
        peak = float(np.max(np.abs(clip))) or 1.0
        clip = clip * (0.78 / peak)

        start_idx = int(cue["start"] * SAMPLE_RATE)
        end_idx = min(total_samples, start_idx + len(clip))
        copy_len = end_idx - start_idx
        if copy_len > 0:
            vo_mix[start_idx:end_idx] += clip[:copy_len]
        actual_spans.append((cue["start"], end_idx / SAMPLE_RATE))

    return vo_mix, actual_spans


def midi_to_hz(midi: float) -> float:
    return 440.0 * (2.0 ** ((midi - 69.0) / 12.0))


def synthesize_rhodes_note(freq: float, dur: float, amp: float, pan: float) -> np.ndarray:
    n = int(dur * SAMPLE_RATE)
    t = np.arange(n, dtype=np.float32) / SAMPLE_RATE
    # Warm electric piano envelope: soft attack + smooth exponential decay + release
    attack = np.minimum(1.0, t / 0.014)
    decay = np.exp(-t * 1.45)
    release = np.clip((dur - t) / 0.12, 0.0, 1.0)
    env = attack * decay * release

    # Rhodes timbre: warm fundamental + gentle 2nd harmonic + brief tine bell at 4x/7x
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
    # Soft 2-pole moving-average lowpass for airy breathy transition
    k = 28
    kernel = np.ones(k, dtype=np.float32) / k
    smooth_l = np.convolve(noise_l, kernel, mode="same")
    smooth_r = np.convolve(noise_r, kernel, mode="same")
    out = np.zeros((n, 2), dtype=np.float32)
    out[:, 0] = smooth_l * env * amp
    out[:, 1] = smooth_r * env * amp
    return out


def synthesize_soundtrack_and_sfx(vo_mix: np.ndarray) -> np.ndarray:
    total_samples = int(DURATION * SAMPLE_RATE)
    music = np.zeros((total_samples, 2), dtype=np.float32)
    rng = np.random.default_rng(42)

    # 96 BPM -> 1 bar = 2.500s -> 6 bars = 15.000s exact
    bars = [
        # (start_s, dur_s, bass_midi, chord_midis, melody_notes)
        (0.00, 2.50, 48, [60, 64, 67, 71, 74], [(0.625, 76), (1.250, 79), (1.875, 74)]),  # Cmaj9
        (2.50, 2.50, 45, [57, 60, 64, 67, 71], [(0.625, 72), (1.250, 76), (1.875, 74)]),  # Am9
        (5.00, 2.50, 41, [53, 57, 60, 64, 67], [(0.625, 76), (1.250, 72), (1.875, 69)]),  # Fmaj9
        (7.50, 2.50, 43, [55, 59, 62, 64, 69], [(0.625, 74), (1.250, 76), (1.875, 79)]),  # G6
        (10.00, 2.50, 40, [52, 59, 62, 64, 67], [(0.625, 76), (1.250, 74), (1.875, 72)]),  # Em7
        (12.50, 2.50, 48, [60, 64, 67, 71, 74], [(0.625, 76), (1.250, 79)]),               # Cmaj9 resolve
    ]

    def place(buf: np.ndarray, clip: np.ndarray, start_s: float) -> None:
        i0 = int(start_s * SAMPLE_RATE)
        if i0 >= total_samples:
            return
        i1 = min(total_samples, i0 + len(clip))
        buf[i0:i1] += clip[: i1 - i0]

    for start_s, bar_dur, bass_midi, chord_midis, melody_notes in bars:
        # Warm root bass pad
        bass = synthesize_bass_note(midi_to_hz(bass_midi), bar_dur + 0.15, amp=0.19)
        place(music, bass, start_s)

        # Gentle arpeggiated Rhodes chord
        pans = [-0.45, -0.20, 0.05, 0.28, 0.48]
        for idx, midi in enumerate(chord_midis):
            note = synthesize_rhodes_note(
                midi_to_hz(midi),
                bar_dur + 0.35,
                amp=0.075,
                pan=pans[idx % len(pans)],
            )
            place(music, note, start_s + idx * 0.026)

        # Soft upper bell motif
        for offset_s, m_midi in melody_notes:
            plk = synthesize_rhodes_note(
                midi_to_hz(m_midi + 12),
                1.10,
                amp=0.042,
                pan=0.22 if offset_s < 1.0 else -0.22,
            )
            place(music, plk, start_s + offset_s)

    # Subtle stereo room delay (180ms L, 270ms R)
    d_l = int(0.180 * SAMPLE_RATE)
    d_r = int(0.270 * SAMPLE_RATE)
    wet = np.zeros_like(music)
    wet[d_l:, 0] = music[:-d_l, 1] * 0.22
    wet[d_r:, 1] = music[:-d_r, 0] * 0.20
    music = music + wet

    # Smooth fade-in (0.45s) & fade-out (0.75s)
    t_all = np.arange(total_samples, dtype=np.float32) / SAMPLE_RATE
    fade_in = np.clip(t_all / 0.45, 0.0, 1.0)
    fade_out = np.clip((DURATION - t_all) / 0.75, 0.0, 1.0)
    music *= (fade_in * fade_out)[:, None]

    # Voiceover envelope follower for silky sidechain ducking
    vo_abs = np.max(np.abs(vo_mix), axis=1)
    win = int(0.140 * SAMPLE_RATE)
    kernel = np.ones(win, dtype=np.float32) / win
    vo_env = np.convolve(vo_abs, kernel, mode="same")
    # Also include tiny lookahead so music ducks right before a syllable
    look = int(0.060 * SAMPLE_RATE)
    vo_env_look = np.maximum(vo_env, np.pad(vo_env[look:], (0, look)))
    duck = 1.0 - 0.72 * np.clip(vo_env_look / 0.07, 0.0, 1.0)
    # Slightly smoother duck curve
    duck = np.convolve(duck, np.ones(int(0.080 * SAMPLE_RATE), dtype=np.float32) / int(0.080 * SAMPLE_RATE), mode="same")

    music_ducked = music * duck[:, None] * 0.65

    # UI SFX: subtle whooshes on scene transitions & gentle clicks on UI actions
    sfx = np.zeros((total_samples, 2), dtype=np.float32)
    for t_whoosh in (3.25, 7.20, 11.15):
        place(sfx, synthesize_whoosh(rng, dur=0.40, amp=0.08), t_whoosh)
    for t_click in (5.15, 8.90):
        place(sfx, synthesize_click(amp=0.16), t_click)

    final_mix = vo_mix * 0.92 + music_ducked + sfx
    return final_mix


def encode_b64_img(path: Path) -> str:
    data = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:image/png;base64,{data}"


def build_stage_html(captures: dict[str, Path], logo_svg: str) -> str:
    imgs = {k: encode_b64_img(v) for k, v in captures.items()}
    cues_js = [
        {
            "start": c["sub_start"],
            "end": c["sub_end"],
            "html": c["subtitle_html"],
        }
        for c in NARRATION_CUES
    ]

    import json

    return f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html, body {{
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: #08192e;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    user-select: none;
  }}

  .stage {{
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: radial-gradient(circle at 20% 20%, #194b75 0%, #0d2744 48%, #071629 100%);
    perspective: 1800px;
  }}

  .orb {{
    position: absolute;
    border-radius: 9999px;
    filter: blur(110px);
    pointer-events: none;
    will-change: transform, opacity;
  }}
  .orb-1 {{
    width: 820px; height: 820px;
    background: rgba(0, 124, 216, 0.30);
    left: -140px; top: -180px;
  }}
  .orb-2 {{
    width: 920px; height: 920px;
    background: rgba(190, 221, 244, 0.22);
    right: -220px; bottom: -260px;
  }}
  .orb-3 {{
    width: 560px; height: 560px;
    background: rgba(18, 56, 84, 0.55);
    left: 650px; top: 240px;
  }}

  /* Subtle studio grid lines */
  .grid-bg {{
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 96px 96px;
    mask-image: radial-gradient(circle at center, black 30%, transparent 88%);
  }}

  /* Top subtle brand pill */
  .top-pill {{
    position: absolute;
    top: 22px;
    right: 36px;
    z-index: 40;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 18px;
    border-radius: 9999px;
    background: rgba(12, 35, 64, 0.78);
    border: 1px solid rgba(190, 221, 244, 0.25);
    backdrop-filter: blur(12px);
    color: #e6f2fc;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.02em;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.22);
  }}
  .top-pill .dot {{
    width: 8px;
    height: 8px;
    border-radius: 9999px;
    background: #38bdf8;
    box-shadow: 0 0 12px #38bdf8;
  }}

  /* Browser mockup container centered cleanly above subtitle band */
  .browser-wrap {{
    position: absolute;
    left: 320px;
    top: 54px;
    width: 1280px;
    height: 836px;
    z-index: 10;
    transform-style: preserve-3d;
    will-change: transform, opacity;
  }}

  .browser {{
    width: 1280px;
    height: 836px;
    border-radius: 22px;
    overflow: hidden;
    background: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.28);
    box-shadow:
      0 42px 110px rgba(3, 12, 26, 0.62),
      0 12px 32px rgba(3, 12, 26, 0.34),
      0 0 0 1px rgba(190, 221, 244, 0.14);
  }}

  .browser-bar {{
    height: 36px;
    background: linear-gradient(180deg, #f1f5f9 0%, #e7eef6 100%);
    border-bottom: 1px solid #d7e2ee;
    display: flex;
    align-items: center;
    padding: 0 16px;
    position: relative;
  }}
  .dots {{
    display: flex;
    gap: 8px;
  }}
  .dots span {{
    width: 11px;
    height: 11px;
    border-radius: 9999px;
  }}
  .dots span:nth-child(1) {{ background: #ff5f57; }}
  .dots span:nth-child(2) {{ background: #febc2e; }}
  .dots span:nth-child(3) {{ background: #28c840; }}

  .url-pill {{
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    height: 23px;
    padding: 0 22px;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid #d5e1ed;
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 12px;
    font-weight: 600;
    color: #334155;
    letter-spacing: 0.01em;
  }}
  .lock-dot {{
    width: 7px; height: 7px; border-radius: 9999px; background: #10b981;
  }}

  .viewport {{
    position: relative;
    width: 1280px;
    height: 800px;
    overflow: hidden;
    background: #fefefe;
  }}

  .screen-layer {{
    position: absolute;
    left: 0;
    top: 0;
    width: 1280px;
    will-change: transform, opacity;
  }}
  .screen-layer img {{
    display: block;
    width: 1280px;
    height: auto;
  }}

  /* Highlight glow rings inside the product detail scene */
  .cta-glow {{
    position: absolute;
    left: 751px;
    top: 418px;
    width: 434px;
    height: 54px;
    border-radius: 14px;
    border: 2.5px solid #38bdf8;
    box-shadow: 0 0 28px rgba(56, 189, 248, 0.72), inset 0 0 18px rgba(56, 189, 248, 0.25);
    opacity: 0;
    pointer-events: none;
    z-index: 25;
  }}

  /* Animated cursor inside viewport */
  .cursor {{
    position: absolute;
    width: 34px;
    height: 34px;
    z-index: 30;
    pointer-events: none;
    opacity: 0;
    filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.35));
    transform-origin: 4px 4px;
  }}

  .ripple {{
    position: absolute;
    width: 56px;
    height: 56px;
    margin-left: -28px;
    margin-top: -28px;
    border-radius: 9999px;
    border: 3px solid #007cd8;
    background: rgba(56, 189, 248, 0.22);
    z-index: 29;
    pointer-events: none;
    opacity: 0;
  }}

  /* Floating mobile mockup for responsive showcase */
  .mobile-wrap {{
    position: absolute;
    right: 88px;
    top: 152px;
    width: 312px;
    height: 690px;
    z-index: 22;
    opacity: 0;
    will-change: transform, opacity;
  }}
  .phone-frame {{
    width: 312px;
    height: 690px;
    padding: 11px;
    border-radius: 42px;
    background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
    border: 1.5px solid rgba(255, 255, 255, 0.28);
    box-shadow:
      0 34px 72px rgba(2, 8, 20, 0.68),
      inset 0 0 0 1px rgba(255, 255, 255, 0.08);
    position: relative;
  }}
  .phone-notch {{
    position: absolute;
    top: 15px;
    left: 50%;
    transform: translateX(-50%);
    width: 72px;
    height: 15px;
    border-radius: 9999px;
    background: #071324;
    z-index: 5;
  }}
  .phone-screen {{
    width: 100%;
    height: 100%;
    border-radius: 32px;
    overflow: hidden;
    background: #123854;
    padding-top: 26px;
  }}
  .phone-screen img {{
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
  }}

  /* Closing brand card overlay */
  .outro {{
    position: absolute;
    inset: 0;
    z-index: 35;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle at 50% 42%, #184a74 0%, #123854 45%, #091d34 100%);
    opacity: 0;
    pointer-events: none;
  }}
  .outro-card {{
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 24px;
    transform: translateY(16px);
  }}
  .outro-logo svg {{
    width: 440px;
    height: auto;
    filter: drop-shadow(0 12px 32px rgba(0,0,0,0.35));
  }}
  .outro-line {{
    width: 160px;
    height: 3px;
    border-radius: 9999px;
    background: linear-gradient(90deg, transparent 0%, #38bdf8 50%, transparent 100%);
  }}
  .outro-title {{
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 46px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.01em;
  }}
  .outro-sub {{
    font-size: 20px;
    font-weight: 500;
    color: #beddf4;
    letter-spacing: 0.04em;
  }}

  /* Burned-in Subtitles anchored cleanly in bottom safe band */
  .subtitle-zone {{
    position: absolute;
    left: 0;
    right: 0;
    bottom: 24px;
    height: 108px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 60;
    pointer-events: none;
  }}
  .subtitle-pill {{
    padding: 13px 34px;
    border-radius: 18px;
    background: rgba(8, 22, 42, 0.88);
    border: 1px solid rgba(190, 221, 244, 0.30);
    backdrop-filter: blur(14px);
    box-shadow: 0 14px 36px rgba(0, 0, 0, 0.42);
    color: #ffffff;
    font-size: 29px;
    font-weight: 600;
    line-height: 1.32;
    text-align: center;
    opacity: 0;
    transform: translateY(10px);
    max-width: 1220px;
  }}
  .subtitle-pill .hl {{
    color: #7dd3fc;
    font-weight: 700;
  }}
</style>
</head>
<body>
<div class="stage">
  <div class="orb orb-1" id="orb1"></div>
  <div class="orb orb-2" id="orb2"></div>
  <div class="orb orb-3" id="orb3"></div>
  <div class="grid-bg"></div>

  <div class="top-pill" id="topPill">
    <span class="dot"></span>
    <span id="topPillText">Catálogo Digital · Vale do Taquari</span>
  </div>

  <div class="browser-wrap" id="browserWrap">
    <div class="browser">
      <div class="browser-bar">
        <div class="dots"><span></span><span></span><span></span></div>
        <div class="url-pill">
          <span class="lock-dot"></span>
          <span id="urlText">emporiohenz.com.br</span>
        </div>
      </div>
      <div class="viewport">
        <div class="screen-layer" id="scHome"><img src="{imgs['home_full']}" /></div>
        <div class="screen-layer" id="scCatAll"><img src="{imgs['catalogo_all']}" /></div>
        <div class="screen-layer" id="scCatSala"><img src="{imgs['catalogo_sala']}" /></div>
        <div class="screen-layer" id="scProd1"><img src="{imgs['produto_var1']}" /></div>
        <div class="screen-layer" id="scProd2"><img src="{imgs['produto_var2']}" /></div>
        <div class="screen-layer" id="scSobre"><img src="{imgs['sobre']}" /></div>

        <div class="cta-glow" id="ctaGlow"></div>
        <div class="ripple" id="ripple"></div>
        <svg class="cursor" id="cursor" viewBox="0 0 28 28" fill="none">
          <path d="M4.5 2.5L23.5 13.5L14.5 15.8L10.2 24.2L4.5 2.5Z" fill="#FFFFFF" stroke="#0C2340" stroke-width="2" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
  </div>

  <div class="mobile-wrap" id="mobileWrap">
    <div class="phone-frame">
      <div class="phone-notch"></div>
      <div class="phone-screen">
        <img src="{imgs['mobile_catalogo']}" />
      </div>
    </div>
  </div>

  <div class="outro" id="outro">
    <div class="outro-card" id="outroCard">
      <div class="outro-logo">{logo_svg}</div>
      <div class="outro-line" id="outroLine"></div>
      <div class="outro-title">Móveis para transformar o seu lar</div>
      <div class="outro-sub">Entrega e montagem em todo Vale do Taquari · Cruzeiro do Sul - RS</div>
    </div>
  </div>

  <div class="subtitle-zone">
    <div class="subtitle-pill" id="subPill"></div>
  </div>
</div>

<script>
const CUES = {json.dumps(cues_js)};

function clamp(v, a = 0, b = 1) {{ return Math.max(a, Math.min(b, v)); }}
function lerp(a, b, t) {{ return a + (b - a) * t; }}
function prog(t, t0, t1) {{ return clamp((t - t0) / (t1 - t0), 0, 1); }}
function easeOutCubic(x) {{ return 1 - Math.pow(1 - x, 3); }}
function easeInOutCubic(x) {{ return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3)/2; }}

const els = {{
  orb1: document.getElementById('orb1'),
  orb2: document.getElementById('orb2'),
  orb3: document.getElementById('orb3'),
  topPill: document.getElementById('topPill'),
  topPillText: document.getElementById('topPillText'),
  urlText: document.getElementById('urlText'),
  browserWrap: document.getElementById('browserWrap'),
  scHome: document.getElementById('scHome'),
  scCatAll: document.getElementById('scCatAll'),
  scCatSala: document.getElementById('scCatSala'),
  scProd1: document.getElementById('scProd1'),
  scProd2: document.getElementById('scProd2'),
  scSobre: document.getElementById('scSobre'),
  cursor: document.getElementById('cursor'),
  ripple: document.getElementById('ripple'),
  ctaGlow: document.getElementById('ctaGlow'),
  mobileWrap: document.getElementById('mobileWrap'),
  outro: document.getElementById('outro'),
  outroCard: document.getElementById('outroCard'),
  outroLine: document.getElementById('outroLine'),
  subPill: document.getElementById('subPill'),
}};

window.__setTime = function(t) {{
  // Ambient background orbs drift
  els.orb1.style.transform = `translate3d(${{Math.sin(t * 0.45) * 45}}px, ${{Math.cos(t * 0.35) * 30}}px, 0)`;
  els.orb2.style.transform = `translate3d(${{Math.cos(t * 0.40) * -50}}px, ${{Math.sin(t * 0.30) * 35}}px, 0)`;

  // Reset all screen layers
  const screens = [els.scHome, els.scCatAll, els.scCatSala, els.scProd1, els.scProd2, els.scSobre];
  for (const s of screens) {{ s.style.opacity = 0; s.style.transform = 'translate3d(0,0,0) scale(1)'; }}

  els.cursor.style.opacity = 0;
  els.ripple.style.opacity = 0;
  els.ctaGlow.style.opacity = 0;
  els.mobileWrap.style.opacity = 0;
  els.outro.style.opacity = 0;

  let bScale = 1.0, bX = 0, bY = 0, bRotY = 0, bRotX = 0, bOpacity = 1;

  // SCENE 1: Home (0.00 -> 3.45)
  if (t < 3.65) {{
    const pIn = easeOutCubic(prog(t, 0.0, 0.75));
    const pScroll = easeInOutCubic(prog(t, 0.90, 3.25));
    bScale = lerp(0.95, 1.00, pIn);
    bRotY = lerp(-3.5, 1.2, easeInOutCubic(prog(t, 0.0, 3.45)));
    bRotX = lerp(2.2, 0.4, pIn);
    bY = lerp(18, 0, pIn);

    const homeOp = t < 3.25 ? 1 : 1 - easeInOutCubic(prog(t, 3.25, 3.65));
    els.scHome.style.opacity = homeOp;
    els.scHome.style.transform = `translate3d(0, ${{-lerp(0, 260, pScroll)}}px, 0)`;

    els.urlText.textContent = 'emporiohenz.com.br';
    els.topPillText.textContent = 'Catálogo Digital · Vale do Taquari';
  }}

  // SCENE 2: Catálogo & Filtros + Mobile (3.25 -> 7.55)
  if (t >= 3.25 && t < 7.60) {{
    const pEnter = easeInOutCubic(prog(t, 3.25, 3.70));
    const pExit = t > 7.20 ? easeInOutCubic(prog(t, 7.20, 7.60)) : 0;
    const vis = pEnter * (1 - pExit);

    const pMove = easeInOutCubic(prog(t, 3.45, 7.35));
    // Shift desktop browser slightly left as mobile phone glides in
    const pMob = easeOutCubic(prog(t, 5.15, 5.90)) * (1 - easeInOutCubic(prog(t, 7.10, 7.55)));
    bX = lerp(0, -100, pMob);
    bScale = lerp(1.00, 0.94, pMob);
    bRotY = lerp(2.2, -1.8, pMove);
    bRotX = 0.5;

    // Crossfade CatAll -> CatSala at filter click t=5.15
    const pFilt = easeOutCubic(prog(t, 5.12, 5.38));
    els.scCatAll.style.opacity = vis * (1 - pFilt);
    els.scCatSala.style.opacity = vis * pFilt;

    // Gentle scroll on filtered catalog
    const catScroll = easeInOutCubic(prog(t, 5.45, 7.20)) * 36;
    els.scCatSala.style.transform = `translate3d(0, ${{-catScroll}}px, 0)`;

    // Mobile mockup floating on the right
    els.mobileWrap.style.opacity = pMob;
    els.mobileWrap.style.transform = `translate3d(${{lerp(60, 0, pMob)}}px, ${{lerp(42, 0, pMob) - Math.sin(t * 1.4) * 5}}px, 0)`;

    // Cursor glides to 'Sala de Estar' chip (1280x800 viewport coords: 209.6, 262.2)
    if (t >= 4.00 && t <= 5.65) {{
      const pCur = easeInOutCubic(prog(t, 4.05, 5.05));
      const cx = lerp(600, 209.6, pCur);
      const cy = lerp(395, 262.2, pCur);
      const cFade = prog(t, 4.00, 4.25) * (1 - prog(t, 5.40, 5.65));
      const press = (t >= 5.08 && t <= 5.22) ? 0.82 : 1.0;
      els.cursor.style.opacity = cFade;
      els.cursor.style.transform = `translate3d(${{cx}}px, ${{cy}}px, 0) scale(${{press}})`;

      if (t >= 5.10 && t <= 5.55) {{
        const rp = prog(t, 5.10, 5.55);
        els.ripple.style.opacity = (1 - rp) * 0.85;
        els.ripple.style.transform = `translate3d(${{209.6}}px, ${{262.2}}px, 0) scale(${{lerp(0.25, 1.65, easeOutCubic(rp))}})`;
      }}
    }}

    if (t >= 3.45) {{
      els.urlText.textContent = t >= 5.15 ? 'emporiohenz.com.br/catalogo?categoria=sala-de-estar' : 'emporiohenz.com.br/catalogo';
      els.topPillText.textContent = 'Pronta Entrega & Sob Encomenda';
    }}
  }}

  // SCENE 3: Product Detail, Finish Switch & WhatsApp CTA (7.20 -> 11.45)
  if (t >= 7.20 && t < 11.50) {{
    const pEnter = easeInOutCubic(prog(t, 7.20, 7.60));
    const pExit = t > 11.10 ? easeInOutCubic(prog(t, 11.10, 11.50)) : 0;
    const vis = pEnter * (1 - pExit);

    const pZoom = easeInOutCubic(prog(t, 7.40, 11.20));
    bScale = lerp(1.00, 1.03, pZoom);
    bX = lerp(0, -24, pZoom);
    bY = lerp(0, -10, pZoom);
    bRotY = lerp(-1.5, 1.4, pZoom);
    bRotX = 0.3;

    // Crossfade Var1 (Bouclé Off White) -> Var2 (Veludo Terracota) at t=8.90
    const pVar = easeOutCubic(prog(t, 8.88, 9.12));
    els.scProd1.style.opacity = vis * (1 - pVar);
    els.scProd2.style.opacity = vis * pVar;

    // Cursor moves from image center -> Swatch 1 (818.9, 272.4) -> WhatsApp CTA (967.6, 444.9)
    if (t >= 7.80 && t <= 10.75) {{
      let cx, cy, press = 1.0;
      if (t < 9.15) {{
        const p1 = easeInOutCubic(prog(t, 7.85, 8.80));
        cx = lerp(490, 818.9, p1);
        cy = lerp(395, 272.4, p1);
        if (t >= 8.84 && t <= 8.98) press = 0.82;
      }} else {{
        const p2 = easeInOutCubic(prog(t, 9.15, 9.95));
        cx = lerp(818.9, 967.6, p2);
        cy = lerp(272.4, 444.9, p2);
      }}
      const cFade = prog(t, 7.80, 8.05) * (1 - prog(t, 10.45, 10.75));
      els.cursor.style.opacity = cFade;
      els.cursor.style.transform = `translate3d(${{cx}}px, ${{cy}}px, 0) scale(${{press}})`;

      if (t >= 8.86 && t <= 9.32) {{
        const rp = prog(t, 8.86, 9.32);
        els.ripple.style.opacity = (1 - rp) * 0.85;
        els.ripple.style.transform = `translate3d(${{818.9}}px, ${{272.4}}px, 0) scale(${{lerp(0.25, 1.65, easeOutCubic(rp))}})`;
      }}
    }}

    // WhatsApp CTA subtle glow highlight
    if (t >= 9.95) {{
      const gIn = easeOutCubic(prog(t, 9.95, 10.35));
      const pulse = 0.72 + 0.28 * Math.sin((t - 9.95) * 5.0);
      els.ctaGlow.style.opacity = vis * gIn * pulse;
    }}

    if (t >= 7.45) {{
      els.urlText.textContent = 'emporiohenz.com.br/catalogo/poltrona-decorativa-ravena';
      els.topPillText.textContent = 'Amostras Reais & Atendimento WhatsApp';
    }}
  }}

  // SCENE 4: Sobre a loja (11.10 -> 12.95) -> Outro Brand Card (12.75 -> 15.00)
  if (t >= 11.10) {{
    const pSobreIn = easeInOutCubic(prog(t, 11.10, 11.50));
    const pSobreZoom = easeOutCubic(prog(t, 11.20, 13.00));
    const pOutro = easeInOutCubic(prog(t, 12.65, 13.30));

    els.scSobre.style.opacity = pSobreIn * (1 - pOutro);
    els.scSobre.style.transform = `scale(${{lerp(1.00, 1.06, pSobreZoom)}})`;

    if (t >= 11.40) {{
      els.urlText.textContent = 'emporiohenz.com.br/sobre-a-loja';
      els.topPillText.textContent = 'Há quase 50 anos · Cruzeiro do Sul - RS';
    }}

    bScale = lerp(1.00, 1.03, pSobreZoom);
    bRotY = lerp(1.0, 0.0, pSobreZoom);
    bRotX = 0;
    bOpacity = 1 - pOutro;

    els.outro.style.opacity = pOutro;
    els.topPill.style.opacity = 1 - pOutro;
    const pCard = easeOutCubic(prog(t, 12.75, 13.55));
    els.outroCard.style.opacity = pCard;
    els.outroCard.style.transform = `translate3d(0, ${{lerp(24, 0, pCard)}}px, 0) scale(${{lerp(0.96, 1.00, pCard)}})`;
    els.outroLine.style.width = `${{lerp(40, 180, pCard)}}px`;
  }} else {{
    els.topPill.style.opacity = 1;
  }}

  els.browserWrap.style.opacity = bOpacity;
  els.browserWrap.style.transform =
    `translate3d(${{bX}}px, ${{bY}}px, 0) rotateY(${{bRotY}}deg) rotateX(${{bRotX}}deg) scale(${{bScale}})`;

  // Subtitles
  let activeCue = null;
  for (const cue of CUES) {{
    if (t >= cue.start && t <= cue.end) {{
      activeCue = cue;
      break;
    }}
  }}
  if (activeCue) {{
    const fadeIn = easeOutCubic(prog(t, activeCue.start, activeCue.start + 0.16));
    const fadeOut = 1 - easeInOutCubic(prog(t, activeCue.end - 0.16, activeCue.end));
    const op = Math.min(fadeIn, fadeOut);
    els.subPill.innerHTML = activeCue.html;
    els.subPill.style.opacity = op;
    els.subPill.style.transform = `translate3d(0, ${{lerp(10, 0, fadeIn)}}px, 0)`;
  }} else {{
    els.subPill.style.opacity = 0;
  }}
}};
</script>
</body>
</html>
"""


def write_srt(out_srt: Path, spans: list[tuple[float, float]]) -> None:
    def fmt_ts(sec: float) -> str:
        ms = int(round(sec * 1000))
        h = ms // 3600000
        ms %= 3600000
        m = ms // 60000
        ms %= 60000
        s = ms // 1000
        ms %= 1000
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

    lines = []
    for idx, (cue, (sp_start, sp_end)) in enumerate(zip(NARRATION_CUES, spans), start=1):
        t0 = min(cue["sub_start"], sp_start)
        t1 = max(cue["sub_end"], sp_end)
        lines.append(f"{idx}\n{fmt_ts(t0)} --> {fmt_ts(t1)}\n{cue['srt_text']}\n")
    out_srt.parent.mkdir(parents=True, exist_ok=True)
    out_srt.write_text("\n".join(lines), encoding="utf-8")


def render_video(html_path: Path, audio_wav: Path, out_mp4: Path, ffmpeg: str, chromium_exec: str | None) -> None:
    out_mp4.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        ffmpeg,
        "-y",
        "-f",
        "image2pipe",
        "-vcodec",
        "mjpeg",
        "-framerate",
        str(FPS),
        "-i",
        "-",
        "-i",
        str(audio_wav),
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-vf",
        "scale=in_range=full:out_range=limited,format=yuv420p",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-profile:v",
        "high",
        "-crf",
        "16",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-ar",
        str(SAMPLE_RATE),
        "-af",
        "alimiter=limit=0.92",
        "-t",
        f"{DURATION:.3f}",
        "-movflags",
        "+faststart",
        str(out_mp4),
    ]

    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    assert proc.stdin is not None

    launch_kwargs: dict[str, object] = {"headless": True}
    if chromium_exec:
        launch_kwargs["executable_path"] = chromium_exec

    with sync_playwright() as p:
        browser = p.chromium.launch(**launch_kwargs)
        page = browser.new_page(viewport={"width": WIDTH, "height": HEIGHT})
        page.goto(html_path.as_uri(), wait_until="networkidle")
        page.evaluate("() => document.fonts.ready")
        page.wait_for_timeout(400)

        for frame_idx in range(TOTAL_FRAMES):
            t = frame_idx / FPS
            page.evaluate(f"window.__setTime({t:.6f})")
            jpg_bytes = page.screenshot(type="jpeg", quality=98)
            proc.stdin.write(jpg_bytes)

        browser.close()

    proc.stdin.close()
    stderr_out = proc.stderr.read().decode("utf-8", errors="replace") if proc.stderr else ""
    ret = proc.wait()
    if ret != 0:
        raise RuntimeError(f"FFmpeg exited with code {ret}:\n{stderr_out}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Gera vídeo promocional do site Empório Henz (<= 15s).")
    parser.add_argument("--base-url", default="http://localhost:3000", help="URL do frontend rodando.")
    parser.add_argument("--captures-dir", default="", help="Pasta opcional com capturas existentes.")
    parser.add_argument("--out-mp4", default=str(DEFAULT_OUT_MP4))
    parser.add_argument("--out-srt", default=str(DEFAULT_OUT_SRT))
    args = parser.parse_args()

    ffmpeg = find_ffmpeg()
    chromium_exec = find_chromium()
    out_mp4 = Path(args.out_mp4).resolve()
    out_srt = Path(args.out_srt).resolve()

    with tempfile.TemporaryDirectory(prefix="emporio-promo-") as tmp:
        work_dir = Path(tmp)
        if args.captures_dir:
            cap_dir = Path(args.captures_dir).resolve()
            captures = {
                "home_full": cap_dir / "01_home_full.png",
                "catalogo_all": cap_dir / "03_catalogo_all.png",
                "catalogo_sala": cap_dir / "04_catalogo_sala.png",
                "produto_var1": cap_dir / "05_produto_var1.png",
                "produto_var2": cap_dir / "05_produto_var2.png",
                "sobre": cap_dir / "06_sobre.png",
                "mobile_catalogo": cap_dir / "08_mobile_catalogo.png",
            }
        else:
            captures = capture_site_screens(args.base_url.rstrip("/"), work_dir / "captures", chromium_exec)

        print("1/4 Sintetizando locução em português...")
        vo_mix, actual_spans = asyncio.run(synthesize_voiceover(work_dir / "tts", ffmpeg))
        for cue, (s0, s1) in zip(NARRATION_CUES, actual_spans):
            print(f"   - {cue['id']}: {s0:.2f}s -> {s1:.2f}s")

        print("2/4 Sintetizando trilha sonora ambiente e mixando áudio...")
        final_audio = synthesize_soundtrack_and_sfx(vo_mix)
        audio_wav = work_dir / "final_mix.wav"
        write_wav_stereo(audio_wav, final_audio)

        print("3/4 Gerando legendas (.srt) e palco animado...")
        write_srt(out_srt, actual_spans)
        logo_svg = LOGO_SVG_PATH.read_text(encoding="utf-8")
        html_path = work_dir / "stage.html"
        html_path.write_text(build_stage_html(captures, logo_svg), encoding="utf-8")

        print(f"4/4 Renderizando {TOTAL_FRAMES} quadros ({WIDTH}x{HEIGHT} @ {FPS}fps) via Chromium -> FFmpeg...")
        render_video(html_path, audio_wav, out_mp4, ffmpeg, chromium_exec)

    print(f"Concluído!\nVídeo: {out_mp4}\nLegenda: {out_srt}")


if __name__ == "__main__":
    main()
