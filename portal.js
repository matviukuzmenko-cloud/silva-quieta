/* Каталог сцен и песочница эффектов. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const lang = () => (document.documentElement.lang === 'en' ? 'en' : 'ru');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* Отслеживание курсора внутри блока: координаты от -1 до 1 */
  function pointer(el, onMove, onLeave) {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      onMove(clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1), clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1));
    });
    el.addEventListener('pointerleave', onLeave);
  }

  /* ---------- Каталог ---------- */
  const filters = $('#cat-filters');
  const cards = $$('#scene-grid .scene');
  filters?.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-cat]');
    if (!b) return;
    $$('button', filters).forEach((x) => x.classList.toggle('on', x === b));
    cards.forEach((c) => { c.hidden = !!b.dataset.cat && c.dataset.cat !== b.dataset.cat; });
  });

  /* Просмотр сцены на весь экран */
  const lb = $('#lb');
  if (lb && typeof lb.showModal === 'function') {
    const view = $('#lb-view', lb), img = $('#lb-img', lb), title = $('#lb-title', lb);
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const tick = () => {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      img.style.transform = `translate3d(${(-cx * 28).toFixed(1)}px, ${(-cy * 16).toFixed(1)}px, 0)`;
      raf = lb.open ? requestAnimationFrame(tick) : 0;
    };
    pointer(view, (x, y) => { tx = x; ty = y; }, () => { tx = 0; ty = 0; });
    cards.forEach((c) => c.addEventListener('click', () => {
      title.textContent = c.dataset[lang()];
      view.style.setProperty('--c1', c.style.getPropertyValue('--c1'));
      view.style.setProperty('--c2', c.style.getPropertyValue('--c2'));
      img.hidden = false;
      img.onerror = () => { img.hidden = true; };
      img.src = c.dataset.full;
      tx = ty = cx = cy = 0;
      lb.showModal();
      if (!reduce && !raf) raf = requestAnimationFrame(tick);
    }));
    const close = () => lb.close();
    $('#lb-close', lb).addEventListener('click', close);
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    lb.addEventListener('close', () => { img.removeAttribute('src'); });
  } else {
    cards.forEach((c) => c.addEventListener('click', () => window.open(c.dataset.full, '_blank', 'noopener')));
  }

  /* ---------- Песочница ---------- */
  const view = $('#lab-view');
  if (!view) return;
  const img = $('#lab-img'), cv = $('#lab-fx'), dim = $('#lab-dim');
  const ctx = cv.getContext('2d');
  const state = { par: 0.6, fx: 'fire' };
  let tx = 0, ty = 0, mx = 0, my = 0, objectURL = null;

  function setPhoto(src, c1, c2) {
    if (c1) view.style.background = `linear-gradient(145deg, ${c1}, ${c2})`;
    img.hidden = false;
    img.onerror = () => { img.hidden = true; };
    img.src = src;
  }

  const thumbs = $$('#lab-thumbs .thumb');
  const pick = (t) => thumbs.forEach((x) => { const on = x === t; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
  thumbs.forEach((t) => t.addEventListener('click', () => {
    pick(t);
    setPhoto(t.dataset.full, t.style.getPropertyValue('--c1'), t.style.getPropertyValue('--c2'));
  }));
  const first = thumbs[0];
  if (first) setPhoto(first.dataset.full, first.style.getPropertyValue('--c1'), first.style.getPropertyValue('--c2'));

  function loadFile(f) {
    if (!f || !f.type.startsWith('image/')) return;
    if (objectURL) URL.revokeObjectURL(objectURL);
    objectURL = URL.createObjectURL(f);
    pick(null);
    view.style.background = '#000';
    setPhoto(objectURL);
  }
  $('#lab-file').addEventListener('change', (e) => loadFile(e.target.files[0]));
  ['dragenter', 'dragover'].forEach((n) => view.addEventListener(n, (e) => { e.preventDefault(); view.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach((n) => view.addEventListener(n, (e) => { e.preventDefault(); view.classList.remove('drag'); }));
  view.addEventListener('drop', (e) => loadFile(e.dataTransfer?.files?.[0]));

  /* Ползунки */
  const par = $('#lab-par'), dimRange = $('#lab-dim-range');
  par.addEventListener('input', () => { state.par = par.value / 100; $('#o-par').textContent = par.value; });
  const setDim = () => { dim.style.opacity = dimRange.value / 100; $('#o-dim').textContent = dimRange.value; };
  dimRange.addEventListener('input', setDim); setDim();

  $('#lab-fx-seg').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-fx]');
    if (!b) return;
    $$('#lab-fx-seg button').forEach((x) => x.classList.toggle('on', x === b));
    state.fx = b.dataset.fx;
    if (reduce) frame(0, 0);
  });

  pointer(view, (x, y) => { tx = x; ty = y; if (reduce) { mx = x; my = y; frame(0, 0); } },
    () => { tx = 0; ty = 0; if (reduce) { mx = my = 0; frame(0, 0); } });

  /* Мягкие частицы: спрайты рисуются один раз */
  function sprite(rgb) {
    const s = document.createElement('canvas'); s.width = s.height = 64;
    const c = s.getContext('2d'), g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(0.35, `rgba(${rgb},0.45)`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g; c.fillRect(0, 0, 64, 64); return s;
  }
  const SPR = { fire: sprite('255,214,140'), snow: sprite('255,255,255'), star: sprite('200,220,255') };
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const P = Array.from({ length: 70 }, () => ({ x: rnd(), y: rnd(), z: rnd(), p: rnd() * 6.28 }));

  let W = 0, H = 0, dpr = 1, t = 0;
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = view.clientWidth; H = view.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    if (reduce) frame(0, 0);
  }
  new ResizeObserver(resize).observe(view); resize();

  function frame(dt) {
    t += dt;
    img.style.transform = `translate3d(${(-mx * state.par * 30).toFixed(1)}px, ${(-my * state.par * 20).toFixed(1)}px, 0)`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const k = state.fx; if (k === 'none') return;
    ctx.globalCompositeOperation = k === 'snow' ? 'source-over' : 'lighter';
    const s = SPR[k];
    for (const p of P) {
      if (k === 'snow') { p.y += (0.025 + 0.05 * p.z) * dt; p.x += Math.sin(t * 0.5 + p.p) * 0.0004; }
      else if (k === 'fire') { p.y -= (0.008 + 0.018 * p.z) * dt; p.x += Math.sin(t * 0.4 + p.p) * 0.0005; }
      p.y = ((p.y % 1) + 1) % 1;
      const size = k === 'star' ? 6 + p.z * 10 : k === 'snow' ? 6 + p.z * 14 : 12 + p.z * 22;
      const a = k === 'snow' ? 0.35 + 0.5 * p.z : 0.25 + 0.65 * Math.abs(Math.sin(t * (k === 'star' ? 1.6 : 1.2) + p.p));
      const x = ((((p.x + 1) % 1) + 1) % 1) * W - mx * state.par * (16 + p.z * 60);
      const y = p.y * H - my * state.par * (10 + p.z * 36);
      ctx.globalAlpha = a;
      ctx.drawImage(s, x - size / 2, y - size / 2, size, size);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  /* Цикл рисуется только пока песочница на экране */
  let visible = false, last = 0;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(view);
  (function loop(ts) {
    const dt = Math.min((ts - last) / 1000, 0.1); last = ts;
    if (visible && !document.hidden && !reduce) {
      mx += (tx - mx) * 0.08; my += (ty - my) * 0.08;
      frame(dt);
    }
    requestAnimationFrame(loop);
  })(0);
})();
