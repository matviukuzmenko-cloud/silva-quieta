/* Общие функции сайта: язык, тема, меню, копирование, версия. */
(() => {
  const root = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const lang = () => (root.lang === 'en' ? 'en' : 'ru');

  /* ---------- Язык ---------- */
  const LABELS = {
    ru: { lang: 'Сменить язык', theme: 'Сменить тему', menu: 'Меню', close: 'Закрыть' },
    en: { lang: 'Switch language', theme: 'Toggle theme', menu: 'Menu', close: 'Close' }
  };
  function applyLang(l) {
    root.lang = l;
    const title = $('title');
    if (title && title.dataset[l]) document.title = title.dataset[l];
    const meta = $('meta[name="description"]');
    if (meta && meta.dataset[l]) meta.content = meta.dataset[l];
    const t = LABELS[l];
    $('#lang-btn')?.setAttribute('aria-label', t.lang);
    $('#theme-btn')?.setAttribute('aria-label', t.theme);
    $('#menu-btn')?.setAttribute('aria-label', t.menu);
    $('#lb-close')?.setAttribute('aria-label', t.close);
  }
  applyLang(lang());
  $('#lang-btn')?.addEventListener('click', () => {
    const next = lang() === 'ru' ? 'en' : 'ru';
    store.set('sq-lang', next);
    applyLang(next);
  });

  /* ---------- Тема ---------- */
  $('#theme-btn')?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    store.set('sq-theme', next);
  });

  /* ---------- Мобильное меню ---------- */
  const menu = $('#menu');
  const burger = $('#menu-btn');
  const setMenu = (open) => {
    menu?.classList.toggle('open', open);
    burger?.setAttribute('aria-expanded', String(open));
  };
  burger?.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  menu?.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Появление блоков ---------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  /* ---------- Подсветка пункта меню по разделу ---------- */
  const spyLinks = $$('.menu a[href^="#"]');
  if (spyLinks.length && 'IntersectionObserver' in window) {
    const byId = new Map(spyLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        spyLinks.forEach((a) => a.classList.remove('active'));
        byId.get(en.target.id)?.classList.add('active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    byId.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* ---------- Копирование команд ---------- */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    const code = document.getElementById(btn.dataset.copy);
    if (!code || !navigator.clipboard) return;
    navigator.clipboard.writeText(code.textContent.trim()).then(() => {
      const old = btn.innerHTML;
      btn.innerHTML = '<span class="ru">Скопировано</span><span class="en">Copied</span>';
      setTimeout(() => { btn.innerHTML = old; }, 1600);
    });
  });

  /* ---------- Защита от устаревшей версии страницы (кеш / кнопка «назад») ---------- */
  const BUILD = $('meta[name="sq-build"]')?.content;
  const checkFresh = () => {
    if (!BUILD || !window.fetch) return;
    fetch(location.pathname + location.search, { cache: 'no-cache' })
      .then((r) => (r.ok ? r.text() : ''))
      .then((html) => {
        const m = html.match(/<meta name="sq-build" content="([^"]+)"/);
        if (!m || m[1] === BUILD) return;
        let tried = null;
        try { tried = sessionStorage.getItem('sq-reloaded'); } catch (e) {}
        if (tried === m[1]) return; /* уже перезагружали — без циклов */
        try { sessionStorage.setItem('sq-reloaded', m[1]); } catch (e) {}
        location.reload();
      })
      .catch(() => {});
  };
  checkFresh();
  window.addEventListener('pageshow', (e) => { if (e.persisted) checkFresh(); });

  /* ---------- Версия и ссылка на скачивание из update.json ---------- */
  fetch('update.json?t=' + Date.now(), { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (!d) return;
      if (d.version) $$('[data-ver]').forEach((el) => { el.textContent = d.version; });
      if (d.downloadURL) $$('[data-dl]').forEach((el) => { el.href = d.downloadURL; });
    })
    .catch(() => {});
})();
