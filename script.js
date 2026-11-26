(() => {
  const root = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const lang = () => (root.lang === 'en' ? 'en' : 'ru');

  const labels = {
    ru: { lang: 'Сменить язык', theme: 'Сменить тему', menu: 'Меню', close: 'Закрыть' },
    en: { lang: 'Switch language', theme: 'Toggle theme', menu: 'Menu', close: 'Close' }
  };
  function setLabel(sel, text) {
    const el = $(sel);
    if (el) el.setAttribute('aria-label', text);
  }
  function applyLang(l) {
    root.lang = l;
    const title = $('title');
    if (title && title.dataset[l]) document.title = title.dataset[l];
    const meta = $('meta[name="description"]');
    if (meta && meta.dataset[l]) meta.content = meta.dataset[l];
    const t = labels[l];
    setLabel('#lang-btn', t.lang);
    setLabel('#theme-btn', t.theme);
    setLabel('#menu-btn', t.menu);
    setLabel('#lb-close', t.close);
  }
  applyLang(lang());
  const langBtn = $('#lang-btn');
  if (langBtn) langBtn.addEventListener('click', () => {
    const next = lang() === 'ru' ? 'en' : 'ru';
    store.set('sq-lang', next);
    applyLang(next);
  });

  const themeBtn = $('#theme-btn');
  if (themeBtn) themeBtn.addEventListener('click', (e) => {
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
    const dx = Math.max(x, innerWidth - x);
    const dy = Math.max(y, innerHeight - y);
    const end = Math.sqrt(dx * dx + dy * dy);
    const vt = document.startViewTransition(apply);
    vt.ready.then(() => {
      root.animate(
        { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + end + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 900, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(() => {});
  });

  const menu = $('#menu');
  const burger = $('#menu-btn');
  const setMenu = (open) => {
    if (menu) menu.classList.toggle('open', open);
    if (burger) burger.setAttribute('aria-expanded', String(open));
  };
  if (burger) burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  if (menu) menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

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

  const heroTitle = $('.hero h1');
  if (heroTitle && !reduced) {
    $$('.ru, .en', heroTitle).forEach((span) => {
      let idx = 0;
      const frag = document.createDocumentFragment();
      Array.from(span.childNodes).forEach((n) => {
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
  if (heroTitle) heroTitle.classList.add('split');

  const split = {
    '.steps': '.step',
    '.faq-list': 'details',
    '.facts': ':scope > div',
    '.two-col': ':scope > *'
  };
  for (const box in split) {
    const kids = split[box];
    $$(box + '.reveal').forEach((el) => {
      el.classList.remove('reveal');
      $$(kids, el).forEach((k) => k.classList.add('reveal'));
    });
  }

  if (!$('.reveal')) $$('main.prose > *:not(.back)').forEach((el) => el.classList.add('reveal'));
  const reveals = $$('.reveal');
  const finish = (el, delay) => setTimeout(() => {
    el.classList.remove('reveal', 'in');
    el.style.transitionDelay = '';
  }, delay + 1300);
  let io = null;
  let firstBatch = true;
  const showAll = () => {
    reveals.forEach((el) => {
      if (!el.classList.contains('reveal') || el.classList.contains('in')) return;
      if (io) io.unobserve(el);
      el.classList.add('in');
      finish(el, 0);
    });
  };
  if ('IntersectionObserver' in window && !reduced) {
    io = new IntersectionObserver((entries) => {
      const base = firstBatch ? 300 : 0;
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

    const edge = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) showAll();
    };
    window.addEventListener('scroll', edge, { passive: true });
    window.addEventListener('resize', edge);
    edge();
  } else {
    showAll();
  }

  const reel = $('#reel');
  const allVideos = $$('main video');
  if (reel) {
    const clips = $$('.clip', reel);
    const pick = (clip) => clips.forEach((c) => c.classList.toggle('on', c === clip));
    clips.forEach((c) => {
      c.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') pick(c); });
      c.addEventListener('click', () => pick(c));
      c.addEventListener('focus', () => pick(c));
    });
    reel.addEventListener('pointerleave', () => pick(clips[1]));
    if (!reduced) {
      const play = (v) => { const p = v.play(); if (p) p.catch(() => {}); };
      if ('IntersectionObserver' in window) {
        const vio = new IntersectionObserver((entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) play(en.target);
            else en.target.pause();
          });
        }, { threshold: 0.15 });
        allVideos.forEach((v) => vio.observe(v));
      } else {
        allVideos.forEach(play);
      }
    }
  }

  const topbar = $('.topbar');
  const fadeEls = reveals.concat(heroTitle ? [heroTitle] : []);
  const reelClips = reel ? $$('.clip', reel) : [];
  const focusRows = $$('.f-row');
  let focused = null;
  const parEls = $$('[data-par]').concat($$('.shot img'));
  let ticking = false;
  const frame = () => {
    ticking = false;
    const y = window.scrollY;
    if (topbar) topbar.classList.toggle('scrolled', y > 8);
    if (focusRows.length) {
      const vh = window.innerHeight;
      let best = null;
      let bestD = Infinity;
      focusRows.forEach((r) => {
        const b = r.getBoundingClientRect();
        const d = Math.abs(b.top + b.height / 2 - vh / 2);
        if (d < bestD) { bestD = d; best = r; }
      });
      if (bestD > vh * 0.75) best = null;
      if (best !== focused) {
        if (focused) focused.classList.remove('is-focus');
        if (best) best.classList.add('is-focus');
        focused = best;
      }
    }
    if (!reduced) {
      const vh = window.innerHeight;
      parEls.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -60 || r.top > vh + 60) return;
        const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
        el.style.translate = '0 ' + (p * -18).toFixed(1) + 'px';
      });
    }
    if (!reduced) {
      const rects = fadeEls.map((el) => el.getBoundingClientRect());
      fadeEls.forEach((el, i) => {
        if (el.classList.contains('reveal')) return;
        const e = Math.max(0, Math.min(1, 1 - (rects[i].bottom - 56) / 170));
        if (e > 0.002) {
          el.classList.add('fade-out');
          el.style.setProperty('--e', e.toFixed(3));
        } else if (el.classList.contains('fade-out')) {
          el.classList.remove('fade-out');
          el.style.removeProperty('--e');
        }
      });
      if (reelClips.length === 3 && window.innerWidth > 760) {
        const rr = reel.getBoundingClientRect();
        const q = Math.max(-1, Math.min(1, (rr.top + rr.height / 2 - window.innerHeight / 2) / window.innerHeight));
        const shift = '0 ' + (q * 18).toFixed(1) + 'px';
        reelClips[0].style.translate = shift;
        reelClips[2].style.translate = shift;
      }
    }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();

  $$('details').forEach((d) => {
    const sum = d.querySelector('summary');
    if (!sum || !d.animate) return;
    sum.addEventListener('click', (e) => {
      if (reduced) return;
      e.preventDefault();
      const from = d.getBoundingClientRect().height;
      if (d._anim) d._anim.cancel();
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

  const countUp = (dt) => {
    Array.from(dt.childNodes).filter((n) => n.nodeType === 3 && /\d/.test(n.nodeValue)).forEach((node) => {
      const tpl = node.nodeValue;
      const nums = (tpl.match(/\d+/g) || []).map(Number);
      let t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / 1200);
        const k = 1 - Math.pow(1 - p, 4);
        let i = 0;
        node.nodeValue = tpl.replace(/\d+/g, () => Math.round(nums[i++] * k));
        if (p < 1) requestAnimationFrame(tick);
      };
      node.nodeValue = tpl.replace(/\d+/g, '0');
      setTimeout(() => requestAnimationFrame((n) => { t0 = n; tick(n); }), 350);
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

  window.addEventListener('pageshow', () => root.classList.remove('leaving'));

  const spyLinks = $$('.menu a[href^="#"]');
  if (spyLinks.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        spyLinks.forEach((a) => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    spyLinks.forEach((a) => {
      const sec = document.getElementById(a.getAttribute('href').slice(1));
      if (sec) spy.observe(sec);
    });
  }

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

  const siteKey = 'sq-site-version';
  const checkSite = () => {
    if (!window.fetch) return;
    fetch('/version.json?t=' + Date.now(), { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const v = d && (d.site || d.version);
        if (!v) return;
        const saved = store.get(siteKey);
        store.set(siteKey, String(v));
        if (saved && saved !== String(v)) {
          fetch(location.href, { cache: 'reload' }).catch(() => {}).then(() => location.reload());
        }
      })
      .catch(() => {});
  };
  checkSite();
  window.addEventListener('pageshow', (e) => { if (e.persisted) checkSite(); });

  fetch('update.json?t=' + Date.now(), { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (!d) return;
      if (d.version) $$('[data-ver]').forEach((el) => { el.textContent = d.version; });
      if (d.downloadURL) $$('[data-dl]').forEach((el) => { el.href = d.downloadURL; });
    })
    .catch(() => {});
})();
