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

  /* ---------- Тема (круговое раскрытие из кнопки) ---------- */
  $('#theme-btn')?.addEventListener('click', (e) => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    const apply = () => { root.dataset.theme = next; store.set('sq-theme', next); };
    const calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (calm) { apply(); return; }
    if (!document.startViewTransition) {
      root.classList.add('theme-fade');
      apply();
      setTimeout(() => root.classList.remove('theme-fade'), 700);
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = document.startViewTransition(apply);
    vt.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
        { duration: 900, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(() => {});
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

  /* ---------- Заголовок hero: слова выезжают из-под маски ---------- */
  const heroTitle = $('.hero h1');
  if (heroTitle && !reduced) {
    $$('.ru, .en', heroTitle).forEach((span) => {
      let idx = 0;
      const frag = document.createDocumentFragment();
      [...span.childNodes].forEach((n) => {
        if (n.nodeType !== 3) { frag.appendChild(n.cloneNode(true)); return; }
        n.nodeValue.split(/(\s+)/).forEach((tok) => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span');
          const wi = document.createElement('span');
          w.className = 'w';
          wi.className = 'wi';
          wi.style.setProperty('--i', idx++);
          wi.textContent = tok;
          w.appendChild(wi);
          frag.appendChild(w);
        });
      });
      span.textContent = '';
      span.appendChild(frag);
    });
  }
  heroTitle?.classList.add('split');

  /* ---------- Появление блоков ---------- */
  /* Крупные контейнеры не двигаем целиком: каскадом появляются их части. */
  const SPLIT = {
    '.grid-3': '.feature > *',
    '.steps': '.step',
    '.faq-list': 'details',
    '.facts': ':scope > div',
    '.two-col': ':scope > *'
  };
  Object.entries(SPLIT).forEach(([box, kids]) => {
    $$(box + '.reveal').forEach((el) => {
      el.classList.remove('reveal');
      $$(kids, el).forEach((k) => k.classList.add('reveal'));
    });
  });
  /* На внутренних страницах помечаем элементы статьи автоматически. */
  if (!$('.reveal')) $$('main.prose > *:not(.back)').forEach((el) => el.classList.add('reveal'));
  const reveals = $$('.reveal');
  const finish = (el, delay) => setTimeout(() => {
    el.classList.remove('reveal', 'in');
    el.style.transitionDelay = '';
  }, delay + 1700);
  let io = null;
  let firstBatch = true;
  const showAll = () => {
    reveals.forEach((el) => {
      if (!el.classList.contains('reveal') || el.classList.contains('in')) return;
      io?.unobserve(el);
      el.classList.add('in');
      finish(el, 0);
    });
  };
  if ('IntersectionObserver' in window && !reduced) {
    io = new IntersectionObserver((entries) => {
      /* соседние блоки, появившиеся одновременно, всплывают каскадом */
      const base = firstBatch ? 300 : 0; /* на первом экране ждём слова заголовка */
      const vis = entries
        .filter((en) => en.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
      if (vis.length) firstBatch = false;
      vis.forEach((en, i) => {
        const el = en.target;
        const delay = base + Math.min(i, 7) * 90;
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

  /* ---------- Шапка, прогресс чтения, параллакс скриншота ---------- */
  const topbar = $('.topbar');
  let progress = null;
  if (topbar) {
    progress = document.createElement('div');
    progress.className = 'progress';
    progress.setAttribute('aria-hidden', 'true');
    topbar.appendChild(progress);
  }
  const shotBox = $('.shot');
  const shotImg = $('.shot img');
  let ticking = false;
  const frame = () => {
    ticking = false;
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    topbar?.classList.toggle('scrolled', y > 8);
    if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    if (shotImg && shotBox && !shotBox.hidden && !reduced) {
      const r = shotBox.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight));
        const s = 1 + (1 - Math.abs(p)) * 0.018;
        shotImg.style.transform = 'translate3d(0,' + (p * -30).toFixed(1) + 'px,0) scale(' + s.toFixed(4) + ')';
      }
    }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();

  /* ---------- Туманности hero следуют за курсором ---------- */
  const heroBox = $('.hero');
  if (heroBox && !reduced) {
    const mist = { tx: 0, ty: 0, x: 0, y: 0, raf: 0 };
    const mistStep = () => {
      mist.x += (mist.tx - mist.x) * 0.045; /* чем меньше коэффициент, тем «тягучее» движение */
      mist.y += (mist.ty - mist.y) * 0.045;
      /* первое пятно идёт за курсором, второе — навстречу: получается глубина */
      heroBox.style.setProperty('--gx1', (mist.x * 170).toFixed(1) + 'px');
      heroBox.style.setProperty('--gy1', (mist.y * 110).toFixed(1) + 'px');
      heroBox.style.setProperty('--gx2', (mist.x * -120).toFixed(1) + 'px');
      heroBox.style.setProperty('--gy2', (mist.y * -80).toFixed(1) + 'px');
      const moving = Math.abs(mist.tx - mist.x) > 0.002 || Math.abs(mist.ty - mist.y) > 0.002;
      mist.raf = moving ? requestAnimationFrame(mistStep) : 0;
    };
    const wake = () => { if (!mist.raf) mist.raf = requestAnimationFrame(mistStep); };
    window.addEventListener('pointermove', (e) => {
      if (heroBox.getBoundingClientRect().bottom < 0) return; /* hero уже прокручен */
      mist.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mist.ty = (e.clientY / window.innerHeight - 0.5) * 2;
      wake();
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => { mist.tx = 0; mist.ty = 0; wake(); });
  }

  /* ---------- Подсветка карточек за курсором ---------- */
  if (window.matchMedia && matchMedia('(hover: hover)').matches) {
    $$('.feature').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- Плавное раскрытие вопросов (FAQ) ---------- */
  $$('details').forEach((d) => {
    const sum = d.querySelector('summary');
    if (!sum || !d.animate) return;
    sum.addEventListener('click', (e) => {
      if (reduced) return;
      e.preventDefault();
      const from = d.getBoundingClientRect().height;
      d._anim?.cancel();
      const opening = !d.open || d._closing;
      d._closing = !opening;
      if (opening) d.open = true;
      const border = d.offsetHeight - d.clientHeight;
      const to = opening ? d.scrollHeight + border : sum.offsetHeight + border;
      d.style.overflow = 'hidden';
      const anim = d._anim = d.animate(
        { height: [from + 'px', to + 'px'] },
        { duration: opening ? 700 : 480, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
      );
      anim.onfinish = () => {
        if (d._anim !== anim) return;
        d._anim = null;
        d._closing = false;
        d.style.overflow = '';
        if (!opening) d.open = false;
      };
    });
  });

  /* ---------- Счётчики в блоке фактов ---------- */
  const countUp = (dt) => {
    [...dt.childNodes].filter((n) => n.nodeType === 3 && /\d/.test(n.nodeValue)).forEach((node) => {
      const tpl = node.nodeValue;
      const nums = (tpl.match(/\d+/g) || []).map(Number);
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / 1800);
        const k = 1 - Math.pow(1 - p, 4);
        let i = 0;
        node.nodeValue = tpl.replace(/\d+/g, () => Math.round(nums[i++] * k));
        if (p < 1) requestAnimationFrame(tick);
      };
      node.nodeValue = tpl.replace(/\d+/g, '0');
      requestAnimationFrame(tick);
    });
  };
  if (!reduced && 'IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        countUp(en.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    $$('.facts dt').forEach((dt) => cio.observe(dt));
  }

  /* ---------- Мягкий уход со страницы при переходе по ссылке ---------- */
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || reduced || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
    const a = e.target.closest('a[href]');
    if (!a || a.target || a.hasAttribute('download')) return;
    let u;
    try { u = new URL(a.href, location.href); } catch (err) { return; }
    if (u.origin !== location.origin || /\.(dmg|zip|pdf|png|jpe?g|svg|json|xml|txt)$/i.test(u.pathname)) return;
    if (samePage(u)) {
      if (!u.hash) { e.preventDefault(); glideTo(0); }
      return;
    }
    e.preventDefault();
    root.classList.add('leaving');
    setTimeout(() => { location.href = u.href; }, 260);
  });
  /* возврат кнопкой «назад» (bfcache) не должен оставлять страницу прозрачной */
  window.addEventListener('pageshow', () => root.classList.remove('leaving'));

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
