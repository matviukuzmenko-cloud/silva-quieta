document.addEventListener('DOMContentLoaded', () => {
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      } else if (entry.boundingClientRect.top > 0) {
        entry.target.classList.remove('visible');
      }
    });
  }, { threshold: 0.1 });

  requestAnimationFrame(() => {
    reveals.forEach(el => observer.observe(el));
  });

  const smoothScrollTo = (targetY, duration = 1200) => {
    const startY = window.scrollY;
    const diff = targetY - startY;
    let startTime = null;

    const easeInOutCubic = (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      window.scrollTo(0, startY + diff * easeInOutCubic(progress));
      if (elapsed < duration) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  };

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') {
        e.preventDefault();
        smoothScrollTo(0, 1150);
        return;
      }
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const y = target.getBoundingClientRect().top + window.scrollY - 64;
        smoothScrollTo(y, 1200);
      }
    });
  });

  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.menu a');
  window.addEventListener('scroll', () => {
    let activeId = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 240) {
        activeId = sec.getAttribute('id');
      }
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + activeId);
    });
  }, { passive: true });

  const screenshot = document.querySelector('.app-screenshot');
  if (screenshot) {
    window.addEventListener('scroll', () => {
      const rect = screenshot.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        const offset = (rect.top - window.innerHeight * 0.4) * 0.04;
        screenshot.style.transform = `translateY(${offset.toFixed(1)}px)`;
      }
    }, { passive: true });
  }

  let lang = 'ru';
  let remoteUpdateData = null;

  const bindCopy = (btnId, codeId) => {
    const btn = document.getElementById(btnId);
    const code = document.getElementById(codeId);
    if (!btn || !code) return;

    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(code.textContent.trim()).then(() => {
        btn.textContent = lang === 'ru' ? 'Скопировано' : 'Copied';
        setTimeout(() => {
          btn.textContent = lang === 'ru' ? 'Копировать' : 'Copy';
        }, 2000);
      });
    });
  };

  bindCopy('copy-cmd-btn', 'xattr-cmd');
  bindCopy('copy-spctl-btn', 'spctl-cmd');

  document.getElementById('theme-btn')?.addEventListener('click', () => {
    const html = document.documentElement;
    html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
  });

  const i18n = {
    ru: {
      page_title: 'Silva Quieta — Живые видео-обои для macOS',
      m_features: 'Возможности',
      m_keys: 'Клавиши',
      m_install: 'Установка',
      m_faq: 'Вопросы',
      m_updates: 'Обновления',
      btn_get: 'Скачать',
      kicker: 'macOS 13.0+ • Apple Silicon (M1–M5) и Intel • v1.2.0',
      h1: 'Живые видео-обои,\nсозданные для Mac.',
      lead: 'Нативный видеодвижок на Swift и AVFoundation без аккаунтов, подписок и фоновых серверов. Плавные сцены, фоновый звук и бережное отношение к батарее вашего MacBook.',
      dl_mac: 'Скачать для macOS',
      explore: 'Инструкция по установке',
      feat_head: 'Продумано до деталей',
      feat_sub: 'Приложение работает в строке меню macOS, не занимает место в Dock и подстраивается под ваш стиль работы.',
      s1_t: 'Аппаратное ускорение\nна Apple Silicon.',
      s1_p: 'Видео декодируется напрямую через встроенный Media Engine чипов M1–M5 без лишней нагрузки на процессор. На базовых MacBook Air с 8 ГБ памяти кэш автоматически ограничивается тремя сценами, сохраняя систему быстрой.',
      s2_t: 'Умная пауза и\nэкономия заряда.',
      s2_p: 'Как только вы разворачиваете любое приложение на весь экран, переходите на работу от батареи, включаете режим энергосбережения, запускаете заставку или блокируете Mac — видео и звук мгновенно встают на паузу.',
      s3_t: 'Отдельный фон для\nкаждого рабочего стола.',
      s3_p: 'Назначайте разные живые обои для каждого внешнего монитора и каждого виртуального пространства Spaces. Свайпайте трекпадом между работой и отдыхом — обои переключатся автоматически.',
      s4_t: 'Фоновый звук и\nсобственные треки.',
      s4_p: 'Включите оригинальную звуковую дорожку выбранных обоев или загрузите собственный аудиофайл в формате MP3, WAV, M4A или AIFF с плавной регулировкой громкости в настройках.',
      s5_t: 'Тонкая настройка\nзатемнения и скорости.',
      s5_p: 'Приглушите яркие сцены ползунком затемнения до 75%, чтобы иконки и виджеты на рабочем столе всегда оставались читаемыми, или замедлите движение видео до медитативных 0.25x.',
      s6_t: 'Встроенная коллекция\nи импорт перетаскиванием.',
      s6_p: 'Сразу после установки доступна коллекция бесшовных сцен. Чтобы добавить свои обои, просто перетащите любые .mp4, .mov или .m4v файлы прямо в окно галереи.',
      keys_head: 'Управление с клавиатуры',
      keys_sub: 'Глобальные горячие клавиши работают из любого приложения. Вы можете изменить их или отключить в настройках Silva Quieta.',
      k_pause: 'Пауза / продолжить воспроизведение',
      k_next: 'Следующие обои в коллекции',
      k_prev: 'Предыдущие обои в коллекции',
      k_gal: 'Открыть галерею обоев',
      k_set: 'Открыть настройки',
      inst_title: 'Установка на macOS',
      inst_sub: 'Приложение распространяется напрямую с официального сайта, без App Store. Если система заблокирует первый запуск, воспользуйтесь инструкцией ниже.',
      st1_t: '1. Стандартная установка',
      st1_d: 'Откройте скачанный образ <strong>Silva_Quieta_Installer.dmg</strong> и перетащите иконку <strong>Silva Quieta</strong> в папку <strong>Applications (Программы)</strong>. После этого запустите программу из папки «Программы» или через Spotlight.',
      st2_t: '2. Если macOS пишет «Не удалось проверить разработчика»',
      st2_d: 'Попробуйте открыть приложение один раз и нажмите «ОК». Затем откройте <strong>Системные настройки → Конфиденциальность и безопасность</strong>, пролистайте страницу вниз и нажмите <strong>«Всё равно открыть»</strong> напротив Silva Quieta.',
      st3_t: '3. Если пишет «Приложение повреждено и не может быть открыто»',
      st3_d: 'На macOS Sequoia и Sonoma это стандартная реакция Gatekeeper на приложения без платной нотаризации Apple. Откройте стандартный <strong>Терминал (Terminal)</strong>, вставьте эту команду и нажмите Enter:',
      st3_note: 'Если система всё ещё ограничивает запуск сторонних программ, можно временно разрешить установку из любых источников:',
      copy_btn: 'Копировать',
      sys_head: 'Совместимость и приватность',
      sys_sub: 'Все видеофайлы, превью и настройки хранятся исключительно локально на вашем компьютере.',
      sys_1_k: 'Операционная система',
      sys_2_k: 'Процессоры',
      sys_3_k: 'Поддерживаемые форматы',
      sys_3_v: 'Видео: MP4, MOV, M4V • Аудио: MP3, WAV, M4A, AIFF',
      sys_4_k: 'Сбор данных и реклама',
      sys_4_v: 'Отсутствуют. Сеть используется только для проверки update.json',
      faq_head: 'Частые вопросы',
      q1: 'Сажает ли программа батарею MacBook?',
      a1: 'При воспроизведении используется аппаратный видеодекодер Apple Silicon, который потребляет минимум энергии. Кроме того, в настройках включена автоматическая пауза при работе от аккумулятора и при открытии окон на весь экран.',
      q2: 'Где хранятся мои добавленные видео?',
      a2: 'Все скопированные видео лежат в папке приложения в Application Support. Вы можете открыть её в любой момент кнопкой «Открыть папку» прямо в главном окне галереи или из меню в верхней панели.',
      q3: 'Как работают обновления?',
      a3: 'При запуске (или по кнопке «Проверить обновления…» в строке меню) программа сверяет версию с silvaquieta.com. Если вышла новая версия, откроется окно со списком улучшений и кнопкой скачивания свежего установщика.',
      q4: 'Можно ли поставить живые обои только на один монитор?',
      a4: 'Да. Если к Mac подключено два или более дисплея, в верхней панели галереи появляется переключатель экранов — вы можете выбрать «Все экраны» или задать отдельные обои для каждого монитора.',
      rel_badge: 'Версия 1.2.0',
      cl_1: 'Добавлена встроенная система проверки обновлений с окном списка изменений',
      cl_2: 'Оптимизация кэша видео и миниатюр для MacBook Air M1 (8 ГБ ОЗУ)',
      cl_3: 'Поддержка фонового звука и загрузки собственных аудиодорожек',
      cl_4: 'Открытие окна галереи и настроек на активном рабочем столе Spaces'
    },
    en: {
      page_title: 'Silva Quieta — Live Video Wallpapers for macOS',
      m_features: 'Features',
      m_keys: 'Shortcuts',
      m_install: 'Installation',
      m_faq: 'FAQ',
      m_updates: 'Releases',
      btn_get: 'Download',
      kicker: 'macOS 13.0+ • Apple Silicon (M1–M5) & Intel • v1.2.0',
      h1: 'Live video wallpapers,\nbuilt for Mac.',
      lead: 'A native Swift and AVFoundation video engine with no accounts, subscriptions, or background servers. Smooth scenes, ambient audio, and battery-aware playback.',
      dl_mac: 'Download for macOS',
      explore: 'Installation guide',
      feat_head: 'Thoughtful down to the details',
      feat_sub: 'Lives quietly in your macOS menu bar, keeps your Dock clean, and adapts automatically to how you work.',
      s1_t: 'Hardware accelerated\non Apple Silicon.',
      s1_p: 'Video decodes directly on the M1–M5 Media Engine with minimal CPU load. On 8 GB MacBook Air models, the cache automatically caps at three scenes to keep macOS responsive.',
      s2_t: 'Smart pause and\nbattery preservation.',
      s2_p: 'The moment you open any app in full screen, switch to battery power, enable Low Power Mode, start a screensaver, or lock your Mac, video and audio pause immediately.',
      s3_t: 'Distinct wallpapers for\nevery Space.',
      s3_p: 'Assign separate scenes to each external display and macOS Space. Swipe between work and relaxation — your desktop adapts automatically.',
      s4_t: 'Ambient audio\nand custom tracks.',
      s4_p: 'Play the original audio track from your wallpaper or load your own MP3, WAV, M4A, or AIFF file with independent volume control.',
      s5_t: 'Fine-tuned dimming\nand playback speed.',
      s5_p: 'Dim bright scenes up to 75% so desktop icons and widgets stay legible, or slow motion down to a calm 0.25x.',
      s6_t: 'Built-in collection\nand drag-and-drop import.',
      s6_p: 'Includes a curated collection of seamless scenes out of the box. Drag and drop any .mp4, .mov, or .m4v files into the gallery to add your own.',
      keys_head: 'Keyboard control',
      keys_sub: 'Global shortcuts work from any app. You can customize or disable them anytime in Silva Quieta settings.',
      k_pause: 'Pause / resume playback',
      k_next: 'Next wallpaper in library',
      k_prev: 'Previous wallpaper in library',
      k_gal: 'Open wallpaper gallery',
      k_set: 'Open settings',
      inst_title: 'Installing on macOS',
      inst_sub: 'Distributed directly from the official site outside the Mac App Store. If macOS blocks the first launch, follow the steps below.',
      st1_t: '1. Standard installation',
      st1_d: 'Open the downloaded <strong>Silva_Quieta_Installer.dmg</strong> disk image and drag <strong>Silva Quieta</strong> into your <strong>Applications</strong> folder. Launch it from Applications or Spotlight.',
      st2_t: '2. If macOS says "Developer cannot be verified"',
      st2_d: 'Try opening the app once and click OK. Then open <strong>System Settings → Privacy & Security</strong>, scroll down, and click <strong>Open Anyway</strong> next to Silva Quieta.',
      st3_t: '3. If macOS says "App is damaged and can’t be opened"',
      st3_d: 'On macOS Sequoia and Sonoma, Gatekeeper shows this message for apps without paid Apple notarization. Open <strong>Terminal</strong>, paste this command, and press Enter:',
      st3_note: 'If macOS still restricts launching third-party apps, you can temporarily allow apps from anywhere:',
      copy_btn: 'Copy',
      sys_head: 'Compatibility & privacy',
      sys_sub: 'All videos, thumbnails, and preferences remain strictly local on your Mac.',
      sys_1_k: 'Operating system',
      sys_2_k: 'Processors',
      sys_3_k: 'Supported formats',
      sys_3_v: 'Video: MP4, MOV, M4V • Audio: MP3, WAV, M4A, AIFF',
      sys_4_k: 'Telemetry & ads',
      sys_4_v: 'None. Network is only used to check update.json',
      faq_head: 'Frequently asked questions',
      q1: 'Does it drain MacBook battery?',
      a1: 'Playback runs on the hardware Apple Silicon video decoder with minimal power draw. Auto-pause on battery and full-screen apps is also built right in.',
      q2: 'Where are my imported videos stored?',
      a2: 'All imported videos are stored inside the app’s Application Support folder. Click "Open Folder" in the gallery or menu bar to access them anytime.',
      q3: 'How do updates work?',
      a3: 'At launch (or via "Check for Updates…" in the menu bar), the app checks silvaquieta.com. When a new version is available, a window displays release notes and downloads the updated installer.',
      q4: 'Can I set live wallpapers on just one display?',
      a4: 'Yes. When multiple monitors are connected, a display selector appears in the gallery toolbar so you can target all screens or individual displays.',
      rel_badge: 'Version 1.2.0',
      cl_1: 'Added built-in update checker with detailed release notes window',
      cl_2: 'Optimized video and thumbnail cache for 8 GB MacBook Air M1',
      cl_3: 'Added ambient sound support and custom audio track import',
      cl_4: 'Gallery and settings windows now open on the active macOS Space'
    }
  };

  const langBtn = document.getElementById('lang-btn');

  const applyLanguage = (targetLang) => {
    lang = targetLang;
    document.documentElement.lang = lang;
    if (langBtn) langBtn.textContent = lang === 'ru' ? 'EN' : 'RU';
    if (i18n[lang].page_title) document.title = i18n[lang].page_title;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.dataset.i18n;
      if (i18n[lang][k]) {
        el.innerHTML = i18n[lang][k].replace(/\n/g, '<br>');
      }
    });

    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const k = el.dataset.i18nHtml;
      if (i18n[lang][k]) {
        el.innerHTML = i18n[lang][k];
      }
    });

    if (remoteUpdateData && remoteUpdateData.version) {
      const rb = document.getElementById('release-badge');
      if (rb) {
        rb.textContent = (lang === 'ru' ? 'Версия ' : 'Version ') + remoteUpdateData.version;
      }
    }
  };

  langBtn?.addEventListener('click', () => {
    applyLanguage(lang === 'ru' ? 'en' : 'ru');
  });

  fetch('/update.json', { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : null))
    .then(data => {
      if (!data) return;
      remoteUpdateData = data;
      if (data.version) {
        const hv = document.getElementById('hero-ver');
        if (hv) hv.textContent = 'v' + data.version;
        const rb = document.getElementById('release-badge');
        if (rb) rb.textContent = (lang === 'ru' ? 'Версия ' : 'Version ') + data.version;
      }
      if (data.title) {
        const rt = document.getElementById('release-title');
        if (rt) rt.textContent = data.title;
      }
      if (data.downloadURL) {
        const hd = document.getElementById('hero-dl');
        const td = document.getElementById('top-dl');
        if (hd) hd.href = data.downloadURL;
        if (td) td.href = data.downloadURL;
      }
      if (Array.isArray(data.changelog) && data.changelog.length > 0) {
        const ul = document.getElementById('changelog-list');
        if (ul) {
          ul.innerHTML = '';
          data.changelog.forEach(text => {
            const li = document.createElement('li');
            li.textContent = text;
            ul.appendChild(li);
          });
        }
      }
    })
    .catch(() => {});
});
