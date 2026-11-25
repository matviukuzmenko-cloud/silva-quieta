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

  /* ---------- Плавная прокрутка по якорям ---------- */
  const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const samePage = (u) => {
    const clean = (p) => p.replace(/index\.html$/, '').replace(/\/+$/, '');
    return u.origin === location.origin && clean(u.pathname) === clean(location.pathname);
  };
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let raf = 0;
  const stopScroll = () => {
    if (raf) { cancelAnimationFrame(raf); raf = 0; root.style.scrollBehavior = ''; }
  };
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((ev) =>
    window.addEventListener(ev, stopScroll, { passive: true }));
  function glideTo(y) {
    stopScroll();
    const start = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const to = Math.max(0, Math.min(y, max));
    const dist = to - start;
    if (!dist) return;
    const dur = Math.min(1600, Math.max(900, Math.abs(dist) * 0.55));
    const t0 = performance.now();
    root.style.scrollBehavior = 'auto';
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      window.scrollTo(0, start + dist * easeInOut(p));
      if (p < 1) raf = requestAnimationFrame(step);
      else { raf = 0; root.style.scrollBehavior = ''; }
    };
    raf = requestAnimationFrame(step);
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
    let u;
    try { u = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
    if (!samePage(u) || u.hash.length < 1) return;
    const id = decodeURIComponent(u.hash.slice(1));
    const target = id === 'top' ? null : document.getElementById(id);
    if (id !== 'top' && !target) return;
    e.preventDefault();
    if (reduced) {
      (target || document.body).scrollIntoView();
    } else if (!target) {
      glideTo(0);
    } else {
      const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 56;
      glideTo(target.getBoundingClientRect().top + window.scrollY - margin);
    }
    try { history.pushState(null, '', u.hash); } catch (err) {}
  });

  /* ---------- Появление блоков ---------- */
  /* На внутренних страницах помечаем элементы статьи автоматически. */
  if (!$('.reveal')) $$('main.prose > *:not(.back)').forEach((el) => el.classList.add('reveal'));
  const reveals = $$('.reveal');
  const finish = (el, delay) => setTimeout(() => {
    el.classList.remove('reveal', 'in');
    el.style.transitionDelay = '';
  }, delay + 1500);
  let io = null;
  const showAll = () => {
    reveals.forEach((el, i) => {
      if (!el.classList.contains('reveal') || el.classList.contains('in')) return;
      io?.unobserve(el);
      el.classList.add('in');
      finish(el, 0);
    });
  };
  if ('IntersectionObserver' in window && !reduced) {
    io = new IntersectionObserver((entries) => {
      /* соседние блоки, появившиеся одновременно, всплывают каскадом */
      entries
        .filter((en) => en.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
        .forEach((en, i) => {
          const el = en.target;
          const delay = Math.min(i, 6) * 100;
          io.unobserve(el);
          el.style.transitionDelay = delay + 'ms';
          el.classList.add('in');
          finish(el, delay);
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
    /* низ страницы: блоки, до которых порог уже не дотянуться, не остаются невидимыми */
    const edge = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) showAll();
    };
    window.addEventListener('scroll', edge, { passive: true });
    window.addEventListener('resize', edge);
    edge();
  } else {
    showAll();
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

  /* ---------- Автообновление при выходе новой версии сайта ---------- */
  const SITE_KEY = 'sq-site-version';
  const checkSite = () => {
    if (!window.fetch) return;
    fetch('/version.json?t=' + Date.now(), { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const v = d && (d.site || d.version);
        if (!v) return;
        const saved = store.get(SITE_KEY);
        store.set(SITE_KEY, String(v)); /* сохраняем до перезагрузки: цикла не будет */
        if (saved && saved !== String(v)) {
          /* обновляем кеш самой страницы и перезагружаем один раз */
          fetch(location.href, { cache: 'reload' }).catch(() => {}).then(() => location.reload());
        }
      })
      .catch(() => {});
  };
  checkSite();
  window.addEventListener('pageshow', (e) => { if (e.persisted) checkSite(); });

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
