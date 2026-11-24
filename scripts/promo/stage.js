/*
 * Palco do vídeo promocional do Empório Henz (1920x1080, 20 s).
 *
 * Regra do palco: cada quadro é uma função PURA do tempo. O renderizador chama
 * window.__setTime(t) para t = 0 .. 20 s e tira um print; nada aqui pode depender de
 * relógio, requestAnimationFrame, transition ou animation do CSS.
 *
 * Roteiro (120 BPM, uma batida a cada 0,5 s):
 *   0,0 a  3,2  abertura: o sofá em tela cheia troca de cor no ritmo (1,5 s e 2,5 s)
 *   3,2 a  6,0  a câmera recua e revela a parede de móveis, cada um trocando de acabamento
 *   6,0 a  7,6  as cores da paleta surgem e voam até o filtro "Cor" do site
 *   7,6 a 12,5  o site: filtro (8,9), card (9,75), acabamento (10,75), WhatsApp (11,6)
 *  12,5 a 16,5  a história: foto da loja, 0 -> 50 anos, foto da equipe
 *  16,5 a 20,0  encerramento: sofá, logo, slogan e contatos
 * Os instantes dos efeitos sonoros (SFX_CUES no .py) batem com esses tempos.
 */
(() => {
  'use strict';

  const P = window.PROMO;
  const L = P.layout;
  const CAP_W = P.captureViewport[0];
  const CAP_H = P.captureViewport[1];

  // ------------------------------------------------------------------ utilitários
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const prog = (t, t0, t1) => clamp((t - t0) / (t1 - t0));
  const E = {
    linear: (x) => x,
    outCubic: (x) => 1 - Math.pow(1 - x, 3),
    inCubic: (x) => x * x * x,
    inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    inOutQuart: (x) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2),
    outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    outBack: (x) => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    },
    inOutSine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  };

  /** Interpola uma trilha de quadros-chave [[t, valor, easing?], ...]; valor pode ser número ou lista. */
  function track(keys, t, ease = E.inOutCubic) {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        const [t0, v0] = keys[i - 1];
        const [t1, v1, e] = keys[i];
        const u = (e || ease)(prog(t, t0, t1));
        return Array.isArray(v0) ? v0.map((x, j) => lerp(x, v1[j], u)) : lerp(v0, v1, u);
      }
    }
    return keys[keys.length - 1][1];
  }

  function el(tag, cls, parent, html) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html !== undefined) node.innerHTML = html;
    if (parent) parent.appendChild(node);
    return node;
  }

  // 'inherit' (e não 'visible'): um filho visível dentro de uma camada escondida continua escondido.
  const show = (node, visible) => {
    node.style.visibility = visible ? 'inherit' : 'hidden';
  };

  function hexToRgb(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mixHex(a, b, u) {
    const ca = hexToRgb(a);
    const cb = hexToRgb(b);
    return `rgb(${ca.map((x, i) => Math.round(lerp(x, cb[i], u))).join(',')})`;
  }

  const ICON = {
    cursor: '<svg viewBox="0 0 28 28"><path d="M4.5 2.5L23.5 13.5L14.5 15.8L10.2 24.2L4.5 2.5Z" fill="#fff" stroke="#0C2340" stroke-width="2" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="#061224" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    doubleCheck: '<svg viewBox="0 0 22 14" fill="none" stroke="#53bdeb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 7.5l4 4L13 2.5"/><path d="M8 11.5l1 1L20 2.5"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.66 15l-1.3 4.76 4.88-1.28A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-2.9.76.78-2.83-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.55.12-.16.25-.63.8-.78.97-.14.16-.29.18-.53.06a6.7 6.7 0 0 1-3.32-2.9c-.25-.43.25-.4.72-1.33.08-.16.04-.3-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.47a.9.9 0 0 0-.65.3 2.73 2.73 0 0 0-.85 2.03 4.74 4.74 0 0 0 1 2.52 10.86 10.86 0 0 0 4.16 3.68c1.55.67 2.16.73 2.93.61.47-.07 1.46-.6 1.66-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.16-.47-.28z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="#fff" stroke="none"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
  };

  const cue = (id) => P.text.find((c) => c.id === id);

  // ------------------------------------------------------------------ texto cinético
  /**
   * Monta as linhas de um texto com cada palavra numa "janela" (k-clip) para entrar de baixo.
   * Palavras entre *asteriscos* ganham a cor de destaque.
   */
  function buildKinetic(container, lines) {
    const words = [];
    lines.forEach((line, lineIdx) => {
      const lineEl = el('span', 'k-line', container);
      const parts = line.split(/(\*[^*]+\*)/).filter(Boolean);
      let first = true;
      parts.forEach((part) => {
        const hl = part.startsWith('*') && part.endsWith('*');
        part.replace(/\*/g, '').split(/\s+/).filter(Boolean).forEach((w) => {
          // Pontuação logo depois de um destaque ("*cor*.") gruda na palavra anterior, sem espaço.
          if (!first && !/^[.,!?;:]/.test(w)) lineEl.appendChild(document.createTextNode(' '));
          first = false;
          const clip = el('span', 'k-clip', lineEl);
          const word = el('span', 'k-word' + (hl ? ' hl' : ''), clip);
          word.textContent = w;
          words.push({ node: word, line: lineIdx });
        });
      });
    });
    return { container, words };
  }

  /** Entrada (de baixo para cima, palavra a palavra) e saída (para cima) de um texto cinético. */
  function kinetic(k, t, tIn, tOut, opts = {}) {
    const { stagger = 0.07, lineDelay = 0.18, dur = 0.7, outDur = 0.38, outStagger = 0.025 } = opts;
    const visible = t >= tIn - 0.01 && t <= tOut + outDur + k.words.length * outStagger + 0.05;
    show(k.container, visible);
    if (!visible) return;
    k.words.forEach((w, i) => {
      const t0 = tIn + i * stagger + w.line * lineDelay;
      const pin = E.outExpo(prog(t, t0, t0 + dur));
      const t1 = tOut + i * outStagger;
      const pout = E.inCubic(prog(t, t1, t1 + outDur));
      const y = (1 - pin) * 118 - pout * 118;
      w.node.style.transform = `translate3d(0, ${y.toFixed(2)}%, 0) rotate(${((1 - pin) * 4).toFixed(2)}deg)`;
    });
  }

  // ------------------------------------------------------------------ montagem do palco
  const stage = document.getElementById('stage');

  // Fundo
  const bg = el('div', 'layer bg', stage);
  const orbA = el('div', 'orb orb-a', bg);
  const orbB = el('div', 'orb orb-b', bg);

  // Parede de móveis (a abertura é o ladrilho do centro, visto bem de perto)
  const TILE_W = 420;
  const TILE_H = 314;
  const STEP_X = TILE_W + 28;
  const STEP_Y = TILE_H + 28;
  const COLS = 7;
  const ROWS = 5;
  const wallBlur = el('div', 'wall-blur', stage);
  const wall = el('div', 'wall', wallBlur);
  const plane = el('div', 'wall-plane', wall);
  const tiles = P.tiles.map((tile, idx) => {
    const c = idx % COLS;
    const r = Math.floor(idx / COLS);
    const node = el('div', 'tile', plane);
    node.style.left = `${(c - (COLS - 1) / 2) * STEP_X - TILE_W / 2}px`;
    node.style.top = `${(r - (ROWS - 1) / 2) * STEP_Y - TILE_H / 2}px`;
    const imgs = tile.variants.map((src) => {
      const img = el('img', '', node);
      img.src = src;
      return img;
    });
    const edges = tile.hero ? [el('div', 'tile-edge', node), el('div', 'tile-edge', node)] : [];
    // Cada ladrilho comum troca de acabamento numa colcheia diferente entre 3,9 s e 5,65 s.
    return { node, imgs, edges, hero: tile.hero, flipAt: 3.9 + ((idx * 3) % 8) * 0.25 };
  });
  const shadeHook = el('div', 'shade shade-hook', wallBlur);
  const shadeCenter = el('div', 'shade shade-center', wallBlur);
  const shadeDark = el('div', 'shade shade-dark', stage);

  // Texto da abertura + etiqueta do acabamento
  const hookCue = cue('hook');
  const hook = buildKinetic(el('div', 'kt hook t-shadow', stage), hookCue.lines);
  hook.container.querySelectorAll('.k-line')[0].classList.add('t-sans-xl');
  hook.container.querySelectorAll('.k-line')[1].classList.add('t-serif-it', 'serif-it');

  // Amostras de tecido: recortes reais do assento do sofá em cada acabamento, com o nome embaixo.
  const heroTile = P.tiles.find((tile) => tile.hero);
  const fabrics = el('div', 'fabrics', stage);
  const fabricRow = el('div', 'fabric-row', fabrics);
  const fabricSwatches = heroTile.variants.map((src) => {
    const sw = el('div', 'fabric', fabricRow);
    sw.style.backgroundImage = `url("${src}")`;
    return sw;
  });
  const fabricNameClip = el('div', 'fabric-name-clip', fabrics);
  const chipNames = P.heroFinishes.map((f) => {
    const n = el('div', 'fabric-name', fabricNameClip);
    n.textContent = f.name;
    return n;
  });

  // Texto da parede
  const wallCue = cue('wall');
  const wallText = buildKinetic(el('div', 'kt wall-text t-shadow', stage), wallCue.lines);
  wallText.container.querySelectorAll('.k-line')[0].classList.add('t-sans-xl');
  wallText.container.querySelectorAll('.k-line')[1].classList.add('t-serif-it', 'serif-it');

  // Paleta
  const paletteCue = cue('palette');
  const paletteTitle = buildKinetic(el('div', 'kt palette-title t-sans-xl t-shadow', stage), paletteCue.lines);
  const balls = P.palette.map((c, i) => {
    const node = el('div', 'swatch-ball' + (c.light ? ' light' : ''), stage);
    node.style.background = `radial-gradient(circle at 35% 30%, ${mixHex(c.hex, '#ffffff', 0.18)} 0%, ${c.hex} 55%, ${mixHex(c.hex, '#000000', 0.18)} 100%)`;
    const n = P.palette.length;
    return { node, x: 960 + (i - (n - 1) / 2) * 134, y: 640 };
  });

  // Navegador
  const BX = 530;
  const BY = 114;
  const VW = 1300;
  const VH = (VW * CAP_H) / CAP_W;
  const K = VW / CAP_W;
  const browserWrap = el('div', 'browser-wrap', stage);
  const browser = el('div', 'browser', browserWrap);
  const bar = el('div', 'browser-bar', browser);
  el('div', 'browser-dots', bar, '<span></span><span></span><span></span>');
  el('div', 'browser-title', bar, 'Empório Henz · Catálogo');
  const viewport = el('div', 'viewport', browser);
  const cam = el('div', 'cam', viewport);
  const screen = (key) => {
    const img = el('img', 'screen', cam);
    img.src = P.screens[key];
    return img;
  };
  const scAll = screen('catalogo_all');
  const scSala = screen('catalogo_sala');
  const scHover = screen('catalogo_sala_hover');
  const scProd1 = screen('produto_var1');
  const scProd2 = screen('produto_var2');
  const ctaGlow = el('div', 'cta-glow', cam);
  ctaGlow.style.left = `${L.cta.x - 6}px`;
  ctaGlow.style.top = `${L.cta.y - 6}px`;
  ctaGlow.style.width = `${L.cta.w + 12}px`;
  ctaGlow.style.height = `${L.cta.h + 12}px`;
  const overlay = el('div', 'viewport-overlay', viewport);
  const ripples = [el('div', 'ripple', overlay), el('div', 'ripple r2', overlay)];
  const cursor = el('div', 'cursor', overlay, ICON.cursor);

  const chat = el('div', 'chat', browserWrap);
  el('div', 'chat-head', chat, `<span class="wa-badge">${ICON.whatsapp}</span><span>Empório Henz</span>`);
  const bubble = el('div', 'chat-bubble', chat);
  el('div', '', bubble).textContent = P.chat.intro;
  el('b', '', bubble).textContent = P.chat.product;
  el('div', '', bubble).textContent = P.chat.finish;
  el('div', 'chat-meta', bubble, `<span>agora</span>${ICON.doubleCheck}`);

  // Passos ao lado do navegador
  const stepsCue = cue('steps');
  const steps = el('div', 'steps', stage);
  const stepRows = stepsCue.lines.map((label, i) => {
    const row = el('div', 'step', steps);
    row.style.top = `${352 + i * 104}px`;
    const num = el('div', 'step-num', row);
    const fill = el('div', 'step-num-fill', num);
    const digit = el('span', '', num, String(i + 1));
    const check = el('div', 'step-check', num, ICON.check);
    const text = el('div', 'step-label', row);
    text.textContent = label;
    return { row, num, fill, digit, check, text, at: stepsCue.at[i] };
  });

  // História
  const history = el('div', 'layer history', stage);
  const historyPhoto = el('img', 'history-photo', history);
  historyPhoto.src = P.photos.showroom;
  el('div', 'history-grade', history);
  const histCue = cue('history');
  const yearsMatch = /(\d+)\s*(.*)/.exec(histCue.lines[1]) || [null, '50', 'anos'];
  const yearsTarget = parseInt(yearsMatch[1], 10);
  const years = el('div', 'years', history);
  const yearsEyebrow = el('div', 'years-eyebrow', years);
  yearsEyebrow.textContent = histCue.lines[0];
  const yearsRow = el('div', 'years-row', years);
  const yearsNum = el('div', 'years-num', yearsRow);
  const yearsUnit = el('div', 'years-unit', yearsRow);
  yearsUnit.textContent = yearsMatch[2];
  const yearsLineWrap = el('div', 'years-line', years);
  const yearsLine = buildKinetic(yearsLineWrap, [histCue.lines[2]]);
  const teamCard = el('div', 'team-card', history);
  const teamImg = el('img', '', teamCard);
  teamImg.src = P.photos.team;
  const familyCue = cue('family');
  const family = buildKinetic(el('div', 'kt family t-shadow', history), familyCue.lines);
  family.container.querySelectorAll('.k-line')[0].classList.add('t-serif-it', 'serif-it');

  // Encerramento
  const end = el('div', 'layer end', stage);
  const endGlow = el('div', 'end-glow', end);
  const sofa = el('img', 'end-sofa', end);
  sofa.src = P.photos.sofaCutout;
  const logoWrap = el('div', 'end-logo', end);
  const logoInner = el('div', 'end-logo-inner', logoWrap, P.logoSvg);
  const endCue = cue('end');
  const tagline = buildKinetic(el('div', 'kt end-tagline t-serif-it', end), endCue.lines);
  const pillsWrap = el('div', 'end-pills', end);
  const pills = [
    ['ig', ICON.instagram, P.contact.instagram],
    ['wa', ICON.whatsapp, P.contact.whatsapp],
    ['', ICON.pin, P.contact.address],
  ].map(([cls, icon, text]) => {
    const pill = el('div', 'contact', pillsWrap);
    el('span', 'contact-icon ' + cls, pill, icon);
    el('span', '', pill).textContent = text;
    return pill;
  });

  const flash = el('div', 'layer flash', stage);

  // ------------------------------------------------------------------ câmera dentro do navegador
  const ctaC = { x: L.cta.x + L.cta.w / 2, y: L.cta.y + L.cta.h / 2 };
  const swC = L.colorSwatches.reduce(
    (acc, s) => ({ x: acc.x + (s.x + s.w / 2) / L.colorSwatches.length, y: acc.y + (s.y + s.h / 2) / L.colorSwatches.length }),
    { x: 0, y: 0 },
  );
  // [t, [zoom, foco x, foco y]] em coordenadas da captura (1440x900)
  const CAM_KEYS = [
    [7.60, [2.4, swC.x, swC.y]],
    [8.30, [1.0, CAP_W / 2, CAP_H / 2], E.inOutQuart],
    [8.85, [1.45, L.chip.x, L.chip.y]],
    [9.50, [1.4, L.card.x, L.card.y]],
    [9.80, [1.4, L.card.x, L.card.y]],
    [10.22, [1.0, CAP_W / 2, CAP_H / 2]],
    [10.70, [1.5, 775, 430]],
    [11.00, [1.5, 775, 430]],
    [11.50, [1.75, ctaC.x, ctaC.y]],
    [12.20, [1.85, ctaC.x, ctaC.y]],
    [12.52, [2.4, ctaC.x, ctaC.y], E.inCubic],
  ];

  function camAt(t) {
    const [z, fx, fy] = track(CAM_KEYS, t);
    const hw = CAP_W / 2 / z;
    const hh = CAP_H / 2 / z;
    return { z, fx: clamp(fx, hw, CAP_W - hw), fy: clamp(fy, hh, CAP_H - hh) };
  }
  /** Ponto da captura -> coordenadas dentro do viewport do navegador. */
  function mapPt(px, py, c) {
    return { x: VW / 2 + c.z * K * (px - c.fx), y: VH / 2 + c.z * K * (py - c.fy) };
  }

  const CURSOR_KEYS = [
    [8.20, [1010, 640]],
    [8.85, [L.chip.x, L.chip.y]],
    [9.10, [L.chip.x, L.chip.y]],
    [9.68, [L.card.x, L.card.y]],
    [10.25, [L.card.x, L.card.y]],
    [10.70, [L.swatch.x, L.swatch.y]],
    [10.95, [L.swatch.x, L.swatch.y]],
    [11.52, [ctaC.x, ctaC.y]],
  ];
  const CLICKS = [
    { t: 8.90, x: L.chip.x, y: L.chip.y },
    { t: 9.75, x: L.card.x, y: L.card.y },
    { t: 10.75, x: L.swatch.x, y: L.swatch.y },
    { t: 11.60, x: ctaC.x, y: ctaC.y },
  ];

  // ------------------------------------------------------------------ quadro
  function render(t) {
    // Fundo
    orbA.style.transform = `translate3d(${Math.sin(t * 0.4) * 60}px, ${Math.cos(t * 0.33) * 40}px, 0)`;
    orbB.style.transform = `translate3d(${Math.cos(t * 0.37) * -70}px, ${Math.sin(t * 0.29) * 45}px, 0)`;

    renderWall(t);
    renderHook(t);
    kinetic(wallText, t, wallCue.start, wallCue.end, { lineDelay: 0.22 });
    renderPalette(t);
    renderBrowser(t);
    renderSteps(t);
    renderHistory(t);
    renderEnd(t);

    // Flashes de câmera fotográfica: loja (12,5 s) e equipe (14,75 s)
    const fA = t < 12.5 ? E.inCubic(prog(t, 12.4, 12.5)) : 1 - E.outCubic(prog(t, 12.5, 12.95));
    const fB = t < 14.75 ? 0.6 * E.inCubic(prog(t, 14.68, 14.75)) : 0.6 * (1 - E.outCubic(prog(t, 14.75, 15.05)));
    flash.style.opacity = Math.max(fA, fB).toFixed(3);
  }

  function renderWall(t) {
    const visible = t < 8.05;
    show(wallBlur, visible);
    show(shadeDark, t > 5.8 && t < 8.05);
    if (!visible) return;

    // Abre como uma fresta que se expande (0 a 0,5 s)
    const uo = E.inOutQuart(prog(t, 0.02, 0.5));
    const iv = lerp(49.6, 0, uo);
    const ih = lerp(28, 0, uo);
    wallBlur.style.clipPath = uo < 1 ? `inset(${iv}% ${ih}% ${iv}% ${ih}% round ${lerp(10, 0, uo)}px)` : 'none';

    // Câmera: aproxima devagar no sofá, recua (em escala logarítmica) e passeia pela parede
    let s;
    if (t < 3.15) s = lerp(4.62, 4.95, E.inOutSine(prog(t, 0, 3.15)));
    else if (t < 4.45) s = Math.exp(lerp(Math.log(4.95), Math.log(1.08), E.inOutQuart(prog(t, 3.15, 4.45))));
    else s = lerp(1.08, 0.94, prog(t, 4.45, 8.0));
    const tilt = E.inOutCubic(prog(t, 3.25, 4.55));
    const rx = lerp(0, 24, tilt);
    const rz = lerp(0, -8, tilt) - 2 * prog(t, 4.55, 8.0);
    const fx = lerp(0, 150, E.inOutSine(prog(t, 3.6, 8.0)));
    const fy = lerp(0, -70, E.inOutSine(prog(t, 3.6, 8.0)));
    plane.style.transform = `rotateX(${rx.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg) scale(${s.toFixed(4)}) translate(${-fx}px, ${-fy}px)`;

    tiles.forEach((tile) => {
      if (tile.hero) {
        // Duas trocas de cor em diagonal, nas batidas 1,5 s e 2,5 s, com um fio de luz na borda
        const k = 0.35;
        [1.5, 2.5].forEach((at, i) => {
          const u = E.inOutCubic(prog(t, at - 0.2, at + 0.2));
          const pp = u * (1 + k);
          const img = tile.imgs[i + 1];
          img.style.clipPath = u <= 0 ? 'inset(0 100% 0 0)' : `polygon(-5% -5%, ${pp * 100}% -5%, ${(pp - k) * 100}% 105%, -5% 105%)`;
          const edge = tile.edges[i];
          edge.style.opacity = u > 0 && u < 1 ? '1' : '0';
          edge.style.left = `${(pp - k / 2) * 100}%`;
          edge.style.transform = `rotate(${(Math.atan2(k * TILE_W, TILE_H) * 180) / Math.PI}deg)`;
        });
      } else {
        const u = E.inOutCubic(prog(t, tile.flipAt, tile.flipAt + 0.4));
        tile.imgs[1].style.clipPath = `inset(0 ${((1 - u) * 100).toFixed(2)}% 0 0)`;
      }
    });

    shadeHook.style.opacity = (E.outCubic(prog(t, 0.3, 0.8)) * (1 - prog(t, 3.0, 3.45))).toFixed(3);
    shadeCenter.style.opacity = (E.outCubic(prog(t, 3.7, 4.1)) * (1 - prog(t, 6.0, 6.3))).toFixed(3);
    shadeDark.style.opacity = (E.inOutCubic(prog(t, 5.8, 6.3)) * (1 - prog(t, 7.45, 8.0))).toFixed(3);
    wallBlur.style.filter = t > 5.8 ? `blur(${(14 * E.inOutCubic(prog(t, 5.8, 6.4))).toFixed(2)}px)` : 'none';
    wallBlur.style.opacity = (1 - E.inOutCubic(prog(t, 7.45, 8.0))).toFixed(3);
  }

  function renderHook(t) {
    kinetic(hook, t, hookCue.start, hookCue.end, { lineDelay: 0.25, stagger: 0.09 });

    const visible = t > 0.85 && t < 3.5;
    show(fabrics, visible);
    if (!visible) return;
    const pout = E.inCubic(prog(t, 3.0, 3.3));
    fabrics.style.opacity = (1 - pout).toFixed(3);
    // A amostra da vez fica maior e acesa; as outras ficam pequenas e apagadas
    const pos = E.inOutCubic(prog(t, 1.4, 1.7)) + E.inOutCubic(prog(t, 2.4, 2.7));
    fabricSwatches.forEach((sw, i) => {
      const tIn = 0.95 + i * 0.07;
      const pin = E.outBack(prog(t, tIn, tIn + 0.45));
      const near = clamp(1 - Math.abs(i - pos));
      sw.style.opacity = (prog(t, tIn, tIn + 0.1) * (0.45 + 0.55 * near)).toFixed(3);
      sw.style.transform = `translate3d(0, ${((1 - pin) * 30).toFixed(2)}px, 0) scale(${(pin * (0.78 + 0.22 * near)).toFixed(4)})`;
      sw.style.borderColor = `rgba(255, 255, 255, ${(0.25 + 0.75 * near).toFixed(3)})`;
    });
    // Nome do acabamento rola para cima a cada troca
    chipNames.forEach((n, i) => {
      n.style.transform = `translate3d(0, ${(i - pos) * 46}px, 0)`;
      n.style.opacity = (prog(t, 1.0, 1.2) * clamp(1 - Math.abs(i - pos) * 1.2)).toFixed(3);
    });
  }

  function renderPalette(t) {
    kinetic(paletteTitle, t, paletteCue.start, paletteCue.end, { stagger: 0.09 });

    const visible = t > 6.0 && t < 7.85;
    balls.forEach((b) => show(b.node, visible));
    if (!visible) return;
    const c = camAt(Math.max(t, 7.6));
    balls.forEach((b, i) => {
      const tIn = 6.08 + i * 0.045;
      const pop = E.outBack(prog(t, tIn, tIn + 0.42));
      let x = b.x;
      let y = b.y + Math.sin(t * 2.2 + i * 0.7) * 6;
      let scale = pop;
      let opacity = prog(t, tIn, tIn + 0.08);
      if (i < L.colorSwatches.length) {
        // As cinco primeiras voam até as bolinhas do filtro "Cor" do site
        const sw = L.colorSwatches[i];
        const p = mapPt(sw.x + sw.w / 2, sw.y + sw.h / 2, c);
        const tx = BX + p.x;
        const ty = BY + 40 + p.y;
        const u = E.inOutCubic(prog(t, 7.12 + i * 0.03, 7.6));
        x = lerp(x, tx, u);
        y = lerp(y, ty, u) - Math.sin(Math.PI * u) * 140;
        scale = lerp(scale, (sw.w * c.z * K) / 104, u);
        opacity *= 1 - prog(t, 7.65, 7.82);
      } else {
        const tOut = 7.0 + (i - L.colorSwatches.length) * 0.025;
        scale *= 1 - E.inCubic(prog(t, tOut, tOut + 0.25));
        opacity *= 1 - prog(t, tOut + 0.1, tOut + 0.25);
      }
      b.node.style.opacity = opacity.toFixed(3);
      b.node.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${Math.max(scale, 0).toFixed(4)})`;
    });
  }

  function renderBrowser(t) {
    const visible = t > 7.12 && t < 12.56;
    show(browserWrap, visible);
    if (!visible) return;

    const uin = E.outExpo(prog(t, 7.15, 7.6));
    const rotY = track([[7.6, 0], [8.6, -6], [10.2, -3.5], [11.25, 0]], t);
    const rotX = track([[7.6, 0], [8.6, 2], [11.25, 0]], t);
    const push = lerp(1, 1.12, E.inCubic(prog(t, 12.2, 12.52)));
    const scale = lerp(0.86, 1, uin) * (1 + 0.015 * prog(t, 7.6, 11.2)) * push;
    browserWrap.style.opacity = prog(t, 7.15, 7.25).toFixed(3);
    browserWrap.style.transform = `perspective(2400px) translate3d(0, ${lerp(70, 0, uin).toFixed(2)}px, 0) rotateX(${rotX.toFixed(3)}deg) rotateY(${rotY.toFixed(3)}deg) scale(${scale.toFixed(4)})`;

    const c = camAt(t);
    cam.style.transform = `translate(${VW / 2}px, ${VH / 2}px) scale(${(c.z * K).toFixed(5)}) translate(${-c.fx.toFixed(2)}px, ${-c.fy.toFixed(2)}px)`;

    // Telas: catálogo -> filtrado (8,9) -> hover no card (9,4) -> produto abre do card (9,8) -> acabamento (10,78)
    const pSala = E.outCubic(prog(t, 8.92, 9.06));
    const pHover = E.outCubic(prog(t, 9.38, 9.52));
    const pProd = E.inOutCubic(prog(t, 9.8, 10.2));
    scAll.style.opacity = pSala < 1 ? '1' : '0';
    scSala.style.opacity = pSala.toFixed(3);
    scHover.style.opacity = pHover.toFixed(3);
    show(scProd1, t >= 9.8);
    if (t >= 9.8) {
      const r = L.cardRect;
      const a = 1 - pProd;
      scProd1.style.clipPath = pProd < 1
        ? `inset(${((r.y / CAP_H) * 100 * a).toFixed(3)}% ${(((CAP_W - r.x - r.w) / CAP_W) * 100 * a).toFixed(3)}% ${(((CAP_H - r.y - r.h) / CAP_H) * 100 * a).toFixed(3)}% ${((r.x / CAP_W) * 100 * a).toFixed(3)}% round ${(18 * a).toFixed(2)}px)`
        : 'none';
      scProd1.style.opacity = prog(t, 9.8, 9.86).toFixed(3);
    }
    const kd = 0.3;
    const pVar = E.inOutCubic(prog(t, 10.77, 11.15)) * (1 + kd);
    show(scProd2, t >= 10.77);
    scProd2.style.clipPath = `polygon(-5% -5%, ${pVar * 100}% -5%, ${(pVar - kd) * 100}% 105%, -5% 105%)`;

    const g = E.outCubic(prog(t, 11.6, 11.8));
    ctaGlow.style.opacity = (g * (0.78 + 0.22 * Math.sin((t - 11.6) * 9))).toFixed(3);

    // Cursor e cliques (fora da câmera: tamanho constante)
    const cp = track(CURSOR_KEYS, t);
    const cpt = mapPt(cp[0], cp[1], c);
    const press = CLICKS.some((k) => t >= k.t - 0.05 && t <= k.t + 0.08) ? 0.84 : 1;
    cursor.style.opacity = (prog(t, 8.2, 8.35) * (1 - prog(t, 12.05, 12.25))).toFixed(3);
    cursor.style.transform = `translate3d(${(cpt.x - 5).toFixed(2)}px, ${(cpt.y - 4).toFixed(2)}px, 0) scale(${press})`;
    const click = CLICKS.find((k) => t >= k.t && t <= k.t + 0.55);
    ripples.forEach((rp, i) => {
      if (!click) {
        rp.style.opacity = '0';
        return;
      }
      const u = prog(t, click.t + i * 0.08, click.t + 0.47 + i * 0.08);
      const pt = mapPt(click.x, click.y, c);
      rp.style.opacity = ((1 - u) * (u > 0 ? 0.9 : 0)).toFixed(3);
      rp.style.transform = `translate3d(${pt.x.toFixed(2)}px, ${pt.y.toFixed(2)}px, 0) scale(${lerp(0.2, 1.5 + i * 0.4, E.outCubic(u)).toFixed(3)})`;
    });

    // Balão da mensagem do WhatsApp saindo do botão
    const pc = E.outBack(prog(t, 11.72, 12.05));
    chat.style.opacity = prog(t, 11.72, 11.8).toFixed(3);
    if (t >= 11.72) {
      const anchor = mapPt(ctaC.x, ctaC.y, c);
      const h = chat.offsetHeight;
      chat.style.transform = `translate3d(${(anchor.x + 40 - 540).toFixed(2)}px, ${(anchor.y + 40 - 50 - h + (1 - pc) * 30).toFixed(2)}px, 0) scale(${Math.max(pc, 0.001).toFixed(4)})`;
    }
  }

  function renderSteps(t) {
    const visible = t > 7.8 && t < 12.6;
    show(steps, visible);
    if (!visible) return;
    const outAt = stepsCue.end;
    stepRows.forEach((s, i) => {
      const tIn = 7.9 + i * 0.08;
      const pin = E.outExpo(prog(t, tIn, tIn + 0.6));
      const tOut = outAt + i * 0.04;
      const pout = E.inCubic(prog(t, tOut, tOut + 0.3));
      const next = stepRows[i + 1];
      const on = E.outCubic(prog(t, s.at, s.at + 0.25));
      const done = next ? E.outCubic(prog(t, next.at, next.at + 0.25)) : 0;
      const active = on * (1 - done);
      s.row.style.opacity = (prog(t, tIn, tIn + 0.15) * (1 - pout) * (0.38 + 0.62 * active + 0.3 * done)).toFixed(3);
      s.row.style.transform = `translate3d(${((1 - pin) * -50 - pout * 50 + active * 10).toFixed(2)}px, 0, 0)`;
      s.fill.style.opacity = Math.max(active, done).toFixed(3);
      s.digit.style.opacity = (1 - done).toFixed(3);
      s.digit.style.color = active > 0.5 ? '#061224' : '';
      s.check.style.opacity = done.toFixed(3);
      s.num.style.transform = `scale(${(1 + 0.12 * Math.sin(Math.PI * prog(t, s.at, s.at + 0.3))).toFixed(3)})`;
    });
  }

  function renderHistory(t) {
    const visible = t >= 12.48 && t < 16.65;
    show(history, visible);
    if (!visible) return;
    const pout = E.inOutQuart(prog(t, 16.2, 16.62));
    history.style.transform = `translate3d(0, ${(-1120 * pout).toFixed(2)}px, 0)`;
    history.style.boxShadow = pout > 0 ? '0 40px 90px rgba(0, 0, 0, 0.55)' : 'none';
    const kb = prog(t, 12.5, 16.6);
    historyPhoto.style.transform = `scale(${lerp(1.16, 1.03, E.outCubic(kb)).toFixed(4)}) translate3d(${lerp(-24, 18, kb).toFixed(2)}px, 0, 0)`;

    // Contador 0 -> 50 anos
    const yOut = E.inCubic(prog(t, histCue.end, histCue.end + 0.3));
    years.style.opacity = (1 - yOut).toFixed(3);
    years.style.transform = `translate3d(0, ${(-60 * yOut).toFixed(2)}px, 0)`;
    yearsEyebrow.style.opacity = prog(t, 12.65, 12.85).toFixed(3);
    yearsEyebrow.style.transform = `translate3d(0, ${(1 - E.outExpo(prog(t, 12.65, 13.2))) * 30}px, 0)`;
    const count = E.outExpo(prog(t, 12.75, 13.85));
    yearsNum.textContent = String(Math.round(yearsTarget * count));
    yearsNum.style.opacity = prog(t, 12.72, 12.82).toFixed(3);
    yearsUnit.style.opacity = prog(t, 13.5, 13.7).toFixed(3);
    yearsUnit.style.transform = `translate3d(${(1 - E.outExpo(prog(t, 13.5, 14.0))) * -30}px, 0, 0)`;
    kinetic(yearsLine, t, 13.85, 99, { stagger: 0.07 });

    // Foto da equipe entra pela direita, como uma foto jogada na mesa
    const tc = E.outExpo(prog(t, 14.7, 15.35));
    show(teamCard, t >= 14.68);
    teamCard.style.transform = `translate3d(${lerp(1150, 0, tc).toFixed(2)}px, ${(Math.sin(t * 1.3) * 5).toFixed(2)}px, 0) rotate(${lerp(9, -2.5, tc).toFixed(3)}deg)`;
    kinetic(family, t, familyCue.start, familyCue.end + 2, { lineDelay: 0.25 });
  }

  function renderEnd(t) {
    const visible = t >= 16.2;
    show(end, visible);
    if (!visible) return;
    end.style.opacity = '1';
    endGlow.style.opacity = (0.75 + 0.25 * Math.sin(t * 1.6)).toFixed(3);

    const ps = E.outExpo(prog(t, 16.22, 17.05));
    sofa.style.opacity = prog(t, 16.22, 16.4).toFixed(3);
    sofa.style.transform = `translate3d(0, ${(lerp(520, 0, ps) + Math.sin(t * 1.2) * 4).toFixed(2)}px, 0) scale(${lerp(0.92, 1, ps).toFixed(4)})`;

    const pl = E.inOutCubic(prog(t, 16.72, 17.25));
    logoInner.style.clipPath = `inset(-10% ${((1 - pl) * 100).toFixed(2)}% -10% 0)`;
    logoInner.style.transform = `translate3d(0, ${((1 - E.outExpo(prog(t, 16.72, 17.35))) * 24).toFixed(2)}px, 0)`;

    kinetic(tagline, t, endCue.start, 99, { stagger: 0.06 });

    pills.forEach((pill, i) => {
      const tIn = 17.6 + i * 0.12;
      const u = E.outExpo(prog(t, tIn, tIn + 0.6));
      pill.style.opacity = prog(t, tIn, tIn + 0.15).toFixed(3);
      pill.style.transform = `translate3d(0, ${((1 - u) * 26).toFixed(2)}px, 0)`;
    });
  }

  // ------------------------------------------------------------------ API do renderizador
  window.__setTime = (t) => render(Math.max(0, Math.min(P.duration, t)));

  window.__ready = (async () => {
    const fonts = [
      '800 100px "Plus Jakarta Sans"',
      '700 100px "Plus Jakarta Sans"',
      '600 100px "Plus Jakarta Sans"',
      '700 100px "Playfair Display"',
      'italic 600 100px "Playfair Display"',
    ];
    try {
      await Promise.all(fonts.map((f) => document.fonts.load(f)));
    } catch (e) {
      /* sem rede: segue com a fonte de reserva */
    }
    await document.fonts.ready;
    await Promise.all([...document.images].map((img) => (img.decode ? img.decode().catch(() => null) : null)));
    window.__setTime(0);
    return true;
  })();

  // Pré-visualização no navegador: palco.html#play toca em loop; palco.html#t=8.9 congela num instante.
  const hash = window.location.hash;
  if (hash === '#play') {
    window.__ready.then(() => {
      const t0 = performance.now();
      const loop = (now) => {
        window.__setTime(((now - t0) / 1000) % P.duration);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });
  } else if (hash.startsWith('#t=')) {
    window.__ready.then(() => window.__setTime(parseFloat(hash.slice(3)) || 0));
  }
})();
