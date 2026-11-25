/* portal.js: каталог, песочница, калькулятор, звуки. Подключать после script.js.
   Язык берётся из <html lang>, который уже переключает ваш script.js. */
(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const L = () => (document.documentElement.lang === 'en' ? 'en' : 'ru');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Сцены (замените res/fps/size на реальные значения) ---------- */
  const CATS = [['nature', 'Природа', 'Nature'], ['night', 'Ночь', 'Night'], ['rain', 'Дождь', 'Rain'], ['cyber', 'Киберпанк', 'Cyberpunk'], ['space', 'Космос', 'Space'], ['minimal', 'Минимализм', 'Minimal']];
  const SCENES = [
    { id: 'forest', cat: 'nature', ru: 'Хвойный лес', en: 'Pine forest', res: '3840×2160', fps: 30, mb: 120 },
    { id: 'lake', cat: 'night', ru: 'Ночное озеро', en: 'Night lake', res: '3840×2160', fps: 30, mb: 95 },
    { id: 'rain', cat: 'rain', ru: 'Дождь за окном', en: 'Rain outside', res: '3840×2160', fps: 30, mb: 80 },
    { id: 'cyber', cat: 'cyber', ru: 'Неоновый город', en: 'Neon city', res: '3840×2160', fps: 60, mb: 160 },
    { id: 'space', cat: 'space', ru: 'Туманность', en: 'Nebula', res: '3840×2160', fps: 30, mb: 110 },
    { id: 'minimal', cat: 'minimal', ru: 'Мягкие волны', en: 'Soft waves', res: '3840×2160', fps: 30, mb: 40 }
  ];

  /* ---------- Рисование сцен ---------- */
  const rnd = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const mk = (n, f, seed) => { const r = rnd(seed); return Array.from({ length: n }, () => f(r)); };
  const D = {
    stars: mk(140, (r) => ({ x: r(), y: r() * 0.7, s: r() * 1.4 + 0.3, p: r() * 6 }), 11),
    flies: mk(34, (r) => ({ x: r(), y: 0.5 + r() * 0.45, p: r() * 6, s: r() * 2 + 1 }), 23),
    drops: mk(150, (r) => ({ x: r(), y: r(), l: r() * 0.05 + 0.03, v: r() * 0.5 + 0.7 }), 37),
    pines: [0, 1, 2].map((k) => mk(14 + k * 4, (r) => ({ x: r(), h: 0.22 + r() * 0.2 + (2 - k) * 0.06, w: 0.05 + r() * 0.03 }), 50 + k)),
    bld: mk(16, (r) => ({ x: r(), w: 0.04 + r() * 0.05, h: 0.2 + r() * 0.35, hue: r() > 0.5 ? 320 : 190 }), 71),
    pts: mk(80, (r) => ({ x: r(), y: r(), z: r() }), 91)
  };
  function sky(c, w, h, a, b, to) { const g = c.createLinearGradient(0, 0, 0, to || h); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(0, 0, w, h); }
  function stars(c, w, h, t, px, k) { c.fillStyle = '#fff'; D.stars.forEach((s) => { c.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.2 + s.p)); c.fillRect(s.x * w - px * k, s.y * h, s.s, s.s); }); c.globalAlpha = 1; }
  function pines(c, w, h, px, py, par) {
    const col = ['#0c1a16', '#08120f', '#050b09'];
    D.pines.forEach((layer, k) => {
      c.fillStyle = col[k]; const off = -px * par * (k + 1) * 0.012 * w, base = h * (0.78 + k * 0.1) - py * par * (k + 1) * 0.004 * h;
      layer.forEach((p) => { const x = p.x * w * 1.1 - 0.05 * w + off, tw = p.w * w * (1 + k * 0.4), th = p.h * h * (1 + k * 0.3); c.beginPath(); c.moveTo(x - tw, base); c.lineTo(x, base - th); c.lineTo(x + tw, base); c.fill(); });
      c.fillRect(0, base - 2, w, h);
    });
  }
  function flies(c, w, h, t, px) {
    c.globalCompositeOperation = 'lighter';
    D.flies.forEach((f) => { const x = (f.x + Math.sin(t * 0.3 + f.p) * 0.03) * w - px * 8, y = (f.y + Math.cos(t * 0.4 + f.p) * 0.03) * h, a = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + f.p)); const g = c.createRadialGradient(x, y, 0, x, y, f.s * 7); g.addColorStop(0, `rgba(255,226,140,${a})`); g.addColorStop(1, 'rgba(255,226,140,0)'); c.fillStyle = g; c.fillRect(x - 12, y - 12, 24, 24); });
    c.globalCompositeOperation = 'source-over';
  }
  function moon(c, w, h, x, y, r) { const g = c.createRadialGradient(x, y, r * 0.3, x, y, r * 4); g.addColorStop(0, 'rgba(230,240,255,.35)'); g.addColorStop(1, 'rgba(230,240,255,0)'); c.fillStyle = g; c.fillRect(x - r * 4, y - r * 4, r * 8, r * 8); c.fillStyle = '#e8eef5'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
  function scene(c, w, h, id, t, px, py, o) {
    o = o || {}; const par = o.par == null ? 1 : o.par;
    if (id === 'forest') { sky(c, w, h, '#06100e', '#1a3a31'); stars(c, w, h, t, px * par, 3); moon(c, w, h, w * 0.74 - px * par * 6, h * 0.22, h * 0.05); pines(c, w, h, px, py, par); if (!o.nofx) flies(c, w, h, t, px * par); }
    else if (id === 'lake') {
      sky(c, w, h, '#050a1c', '#233a78', h * 0.62); stars(c, w, h, t, px * par, 3); moon(c, w, h, w * 0.7 - px * par * 6, h * 0.2, h * 0.045);
      c.fillStyle = '#07101f'; c.fillRect(0, h * 0.62, w, h); const g = c.createLinearGradient(0, h * 0.62, 0, h); g.addColorStop(0, '#1a2c55'); g.addColorStop(1, '#050a14'); c.fillStyle = g; c.fillRect(0, h * 0.62, w, h);
      c.strokeStyle = 'rgba(230,240,255,.35)'; for (let i = 0; i < 9; i++) { const y = h * 0.64 + i * h * 0.03, hw = (60 + i * 18) * (1 + 0.1 * Math.sin(t + i)); c.beginPath(); c.moveTo(w * 0.7 - px * par * 6 - hw, y); c.lineTo(w * 0.7 - px * par * 6 + hw, y); c.stroke(); }
      pines(c, w, h * 0.78, px, py, par);
    } else if (id === 'rain') {
      sky(c, w, h, '#2a343c', '#8fa1ae'); c.fillStyle = 'rgba(10,14,18,.55)'; D.bld.forEach((b) => c.fillRect(b.x * w - px * par * 6, h * (1 - b.h), b.w * w, h));
      c.strokeStyle = 'rgba(210,225,240,.55)'; c.lineWidth = 1; c.beginPath(); D.drops.forEach((d) => { const y = ((d.y + t * d.v * 0.6) % 1) * h, x = d.x * w - y * 0.12; c.moveTo(x, y); c.lineTo(x - 2, y + d.l * h); }); c.stroke();
    } else if (id === 'cyber') {
      sky(c, w, h, '#0a0618', '#3a1270', h * 0.6); const s = c.createRadialGradient(w / 2, h * 0.5, 0, w / 2, h * 0.5, h * 0.28); s.addColorStop(0, '#ffb347'); s.addColorStop(0.5, '#ff2e93'); s.addColorStop(1, 'rgba(255,46,147,0)'); c.fillStyle = s; c.fillRect(0, 0, w, h * 0.6);
      D.bld.forEach((b) => { const x = b.x * w - px * par * 8; c.fillStyle = '#0b0714'; c.fillRect(x, h * (0.6 - b.h * 0.7), b.w * w, h * 0.7); c.fillStyle = `hsla(${b.hue},100%,60%,.8)`; for (let i = 0; i < 5; i++) c.fillRect(x + 4, h * (0.6 - b.h * 0.7) + i * 14 + 6, b.w * w - 8, 2); });
      c.fillStyle = '#0b0714'; c.fillRect(0, h * 0.6, w, h); c.strokeStyle = 'rgba(255,46,147,.7)'; for (let i = -10; i <= 10; i++) { c.beginPath(); c.moveTo(w / 2, h * 0.6); c.lineTo(w / 2 + i * w * 0.18 - px * par * 20, h); c.stroke(); }
      for (let i = 0; i < 8; i++) { const y = h * 0.6 + Math.pow(((i + t * 0.4) % 8) / 8, 2) * h * 0.4; c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    } else if (id === 'space') {
      c.fillStyle = '#02030a'; c.fillRect(0, 0, w, h);
      [[0.3, 0.4, '#7a2fd0'], [0.7, 0.55, '#2f6fd0'], [0.5, 0.3, '#d04b9a']].forEach((n, i) => { const x = w * n[0] + Math.sin(t * 0.15 + i) * 30 - px * par * (10 + i * 6), y = h * n[1] + Math.cos(t * 0.12 + i) * 20, g = c.createRadialGradient(x, y, 0, x, y, w * 0.4); g.addColorStop(0, n[2] + '88'); g.addColorStop(1, n[2] + '00'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
      D.pts.forEach((p) => { c.fillStyle = '#fff'; c.globalAlpha = 0.4 + p.z * 0.6; c.fillRect(((p.x * w - px * par * 30 * p.z) % w + w) % w, (p.y * h - py * par * 20 * p.z + t * 2 * p.z) % h, 1 + p.z * 1.6, 1 + p.z * 1.6); }); c.globalAlpha = 1;
    } else {
      sky(c, w, h, '#efe9dd', '#cdbfa6'); [['#d8cbb2', 0.55, 0.0], ['#c4b595', 0.65, 1.7], ['#aa9a78', 0.75, 3.1]].forEach((v, i) => { c.fillStyle = v[0]; c.beginPath(); c.moveTo(0, h); for (let x = 0; x <= w; x += 20) c.lineTo(x, h * v[1] + Math.sin(x / w * 5 + t * 0.4 + v[2]) * h * 0.04 - px * par * (i + 1) * 4); c.lineTo(w, h); c.fill(); });
    }
  }

  /* ---------- Цикл рисования ---------- */
  const vis = new Set(), io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? vis.add(e.target) : vis.delete(e.target))));
  let last = 0;
  function loop(ts) {
    const t = ts / 1000, slow = ts - last > 40;
    if (!document.hidden) vis.forEach((c) => { if (c.__live || slow) c.__draw(reduce ? 0 : t); });
    if (slow) last = ts;
    requestAnimationFrame(loop);
  }
  function reg(c, fn, live) { c.__draw = fn; c.__live = !!live; io.observe(c); fn(0); }

  /* ---------- Каталог ---------- */
  let cat = '', q = '';
  function buildFilters() {
    const box = $('#cat-filters'); if (!box) return;
    [...box.querySelectorAll('button')].forEach((b) => b.remove());
    [['', 'Все', 'All'], ...CATS].forEach((c) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip-btn' + (c[0] === cat ? ' on' : ''); b.textContent = L() === 'ru' ? c[1] : c[2]; b.onclick = () => { cat = c[0]; renderGrid(); buildFilters(); }; box.appendChild(b); });
  }
  function renderGrid() {
    const g = $('#scene-grid'); if (!g) return; g.innerHTML = '';
    SCENES.filter((s) => (!cat || s.cat === cat) && (s.ru + s.en).toLowerCase().includes(q)).forEach((s) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'scene-card';
      const cv = document.createElement('canvas'); cv.width = 480; cv.height = 300;
      const m = document.createElement('div'); m.className = 'meta'; m.innerHTML = `${s[L()]}<small>${s.res} · ${s.fps} FPS · ${s.mb} MB</small>`;
      b.append(cv, m); g.appendChild(b); const c = cv.getContext('2d'); reg(cv, (t) => scene(c, 480, 300, s.id, t, 0, 0, { par: 0 }));
      b.onclick = () => openLB(s);
    });
  }
  const lb = document.createElement('div'); lb.id = 'lightbox'; lb.innerHTML = '<button type="button" class="cta-pill" id="lb-close">✕</button><canvas width="1280" height="720"></canvas>'; document.body.appendChild(lb);
  let lbScene = null, lbx = 0, lby = 0;
  const lc = lb.querySelector('canvas'), lctx = lc.getContext('2d');
  reg(lc, (t) => lbScene && scene(lctx, 1280, 720, lbScene.id, t, lbx, lby, { par: 1 }), true);
  lc.onpointermove = (e) => { const r = lc.getBoundingClientRect(); lbx = (e.clientX - r.left) / r.width * 2 - 1; lby = (e.clientY - r.top) / r.height * 2 - 1; };
  function openLB(s) { lbScene = s; lb.classList.add('on'); }
  lb.onclick = (e) => { if (e.target === lb || e.target.id === 'lb-close') lb.classList.remove('on'); };
  addEventListener('keydown', (e) => { if (e.key === 'Escape') lb.classList.remove('on'); });
  $('#scene-q')?.addEventListener('input', (e) => { q = e.target.value.toLowerCase(); renderGrid(); });

  /* ---------- Песочница ---------- */
  const lab = $('#lab-cv');
  if (lab) {
    const c = lab.getContext('2d'), W = 960, H = 600; let img = null, tx = 0, ty = 0, mx = 0, my = 0;
    const sel = $('#lab-scene'); SCENES.forEach((s) => { const o = document.createElement('option'); o.value = s.id; o.textContent = s.ru + ' / ' + s.en; sel.appendChild(o); });
    $('#lab-file').onchange = (e) => { const f = e.target.files[0]; if (!f) return; const i = new Image(); i.onload = () => (img = i); i.src = URL.createObjectURL(f); };
    $('#lab-view').onpointermove = (e) => { const r = lab.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width * 2 - 1; ty = (e.clientY - r.top) / r.height * 2 - 1; };
    $('#lab-view').onpointerleave = () => { tx = 0; ty = 0; };
    const out = (id, o, f) => { const el = $(id); el.oninput = () => ($(o).textContent = f(el.value)); };
    out('#lab-par', '#o-par', (v) => v); out('#lab-dim', '#o-dim', (v) => v); out('#lab-spd', '#o-spd', (v) => (v / 100).toFixed(2) + 'x');
    const P = mk(110, (r) => ({ x: r(), y: r(), z: r() }), 5); let tt = 0, prev = 0;
    reg(lab, (ts) => {
      const dt = Math.min(ts - prev, 0.1); prev = ts; const spd = $('#lab-spd').value / 100, par = $('#lab-par').value / 100; tt += dt * spd;
      mx += (tx - mx) * 0.08; my += (ty - my) * 0.08;
      if (img) { const k = Math.max(W / img.width, H / img.height) * 1.12; c.drawImage(img, (W - img.width * k) / 2 - mx * par * 30, (H - img.height * k) / 2 - my * par * 20, img.width * k, img.height * k); }
      else scene(c, W, H, sel.value, tt, mx, my, { par, nofx: true });
      const kind = $('#lab-pt').value;
      if (kind !== 'none') P.forEach((p) => {
        const sp = kind === 'snow' ? 0.06 : kind === 'fire' ? -0.02 : 0.004; p.y = (((p.y + sp * dt * spd) % 1) + 1) % 1;
        const x = (p.x + Math.sin(tt * 0.6 + p.z * 9) * 0.015) * W - mx * par * (10 + p.z * 40), y = p.y * H - my * par * (6 + p.z * 24);
        if (kind === 'fire') { c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x, y, 0, x, y, 9); g.addColorStop(0, 'rgba(255,226,140,.9)'); g.addColorStop(1, 'rgba(255,226,140,0)'); c.fillStyle = g; c.fillRect(x - 9, y - 9, 18, 18); c.globalCompositeOperation = 'source-over'; }
        else { c.fillStyle = '#fff'; c.globalAlpha = kind === 'star' ? 0.3 + 0.7 * Math.abs(Math.sin(tt * 2 + p.z * 20)) : 0.85; c.beginPath(); c.arc(x, y, kind === 'star' ? 1.3 : 1.2 + p.z * 2, 0, 7); c.fill(); c.globalAlpha = 1; }
      });
      c.fillStyle = `rgba(0,0,0,${$('#lab-dim').value / 100})`; c.fillRect(0, 0, W, H);
    }, true);
  }

  /* ---------- Калькулятор ---------- */
  const cs = { res: 1, ap: 1 };
  function calc() {
    const intel = $('#c-model')?.value === 'i'; if (!$('#c-model')) return;
    const k = cs.res === 2 ? 1 : 0, lo = intel ? [75, 110][k] : [45, 60][k], hi = intel ? [110, 160][k] : [60, 90][k];
    const cpu = (intel ? [3, 6][k] : [0.6, 1.8][k]) * (cs.ap ? 0.7 : 1), bat = (intel ? 2 : 1) * (1 + k) * (cs.ap ? 0.5 : 1);
    $('#r-ram').textContent = `${lo}–${hi} MB`; $('#r-cpu').textContent = intel ? '≈ ' + cpu.toFixed(0) + '%' : '< 2%';
    $('#r-bat').textContent = bat <= 1 ? (L() === 'ru' ? 'Низкое' : 'Low') : bat <= 2 ? (L() === 'ru' ? 'Умеренное' : 'Moderate') : (L() === 'ru' ? 'Заметное' : 'Noticeable');
    $('#m-ram').style.width = (hi / 160 * 100) + '%'; $('#m-cpu').style.width = Math.min(cpu / 8 * 100, 100) + '%'; $('#m-bat').style.width = Math.min(bat / 4 * 100, 100) + '%';
  }
  $('#c-model')?.addEventListener('change', calc);
  [['#c-res', 'res'], ['#c-ap', 'ap']].forEach(([id, key]) => $$(id + ' button').forEach((b) => (b.onclick = () => { $$(id + ' button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); cs[key] = +b.dataset.v; calc(); })));

  /* ---------- Звуки (Web Audio) ---------- */
  let AC, master; const run = {};
  const SND = [['rain', 'Дождь', 'Rain', 'шум и лёгкий шелест', 'filtered noise'], ['wind', 'Ночной ветер', 'Night wind', 'медленные порывы', 'slow gusts'], ['fire', 'Костёр', 'Campfire', 'гул и потрескивание', 'rumble and crackle']];
  function noiseSrc() { const b = AC.createBuffer(1, AC.sampleRate * 3, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = AC.createBufferSource(); s.buffer = b; s.loop = true; s.start(); return s; }
  const filt = (type, f, q) => { const x = AC.createBiquadFilter(); x.type = type; x.frequency.value = f; if (q) x.Q.value = q; return x; };
  function start(id) {
    AC = AC || new AudioContext(); if (AC.state === 'suspended') AC.resume(); if (!master) { master = AC.createGain(); master.gain.value = $('#vol').value / 100 * 0.6; master.connect(AC.destination); }
    const g = AC.createGain(); g.gain.value = 0; g.gain.linearRampToValueAtTime(1, AC.currentTime + 1); g.connect(master); const n = noiseSrc(), stops = [() => n.stop()];
    if (id === 'rain') { const hp = filt('highpass', 1200), lp = filt('lowpass', 7000); n.connect(hp); hp.connect(lp); lp.connect(g); }
    if (id === 'wind') { const bp = filt('bandpass', 380, 0.9), lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = 0.12; lg.gain.value = 220; lfo.connect(lg); lg.connect(bp.frequency); lfo.start(); n.connect(bp); bp.connect(g); stops.push(() => lfo.stop()); }
    if (id === 'fire') { const lp = filt('lowpass', 260), gg = AC.createGain(); gg.gain.value = 0.9; n.connect(lp); lp.connect(gg); gg.connect(g);
      const iv = setInterval(() => { const b = AC.createBufferSource(), buf = AC.createBuffer(1, 900, AC.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); b.buffer = buf; const h = filt('highpass', 1800 + Math.random() * 2500), v = AC.createGain(); v.gain.value = Math.random() * 0.8; b.connect(h); h.connect(v); v.connect(g); b.start(); }, 120); stops.push(() => clearInterval(iv)); }
    run[id] = { g, stop: () => { g.gain.cancelScheduledValues(AC.currentTime); g.gain.linearRampToValueAtTime(0, AC.currentTime + 0.6); setTimeout(() => stops.forEach((f) => f()), 700); } };
  }
  function renderSounds() {
    const box = $('#sounds-list'); if (!box) return; box.innerHTML = '';
    SND.forEach((s) => { const d = document.createElement('div'); d.className = 'snd' + (run[s[0]] ? ' on' : ''); const ru = L() === 'ru';
      d.innerHTML = `<div><h4>${ru ? s[1] : s[2]}</h4><p>${ru ? s[3] : s[4]}</p></div><button type="button" class="chip-btn">${run[s[0]] ? '■' : '▶'}</button>`;
      d.querySelector('button').onclick = () => { if (run[s[0]]) { run[s[0]].stop(); delete run[s[0]]; } else start(s[0]); renderSounds(); }; box.appendChild(d); });
  }
  $('#vol')?.addEventListener('input', (e) => master && (master.gain.value = e.target.value / 100 * 0.6));

  /* ---------- Диагностика Gatekeeper, копирование ---------- */
  $$('#err-tabs button').forEach((b) => (b.onclick = () => { $$('#err-tabs button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); $$('.err-panel').forEach((p) => p.classList.toggle('on', p.id === b.dataset.e)); }));
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-copy]'); if (!b) return; const t = document.getElementById(b.dataset.copy).textContent.trim(); navigator.clipboard?.writeText(t).then(() => { const old = b.innerHTML; b.textContent = '✓'; setTimeout(() => (b.innerHTML = old), 1500); }); });

  /* ---------- update.json для блока версий ---------- */
  fetch('/update.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).then((d) => {
    if (!d) return; if (d.title) $('#rm-title').textContent = d.title; if (d.version) $('#rm-ver').textContent = d.version;
    if (Array.isArray(d.changelog)) { const ul = $('#rm-list'); ul.innerHTML = ''; d.changelog.forEach((t) => { const li = document.createElement('li'); li.textContent = t; ul.appendChild(li); }); }
  }).catch(() => {});

  /* ---------- Язык ---------- */
  const relang = () => { buildFilters(); renderGrid(); renderSounds(); calc(); };
  new MutationObserver(relang).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  relang(); requestAnimationFrame(loop);
})();
