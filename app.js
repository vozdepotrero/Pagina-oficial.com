/* Voz de Potrero V1 — navegación, contenido y contacto */
(function () {
  'use strict';

  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const PROFILE = {
    instagram: 'https://www.instagram.com/vozdepotrero?mdxt=YXZzaDRnajF6ZXJz',
    tiktok: 'https://www.tiktok.com/@vozdepotrero?_r=1&_t=ZS-9ATVXpB0AOD',
    youtube: 'https://youtube.com/@vozdepotrero?si=wzgIreyLY0ZAkZiC'
  };

  const MEDIA_FALLBACK = [
    { id: 'ig-1', platform: 'instagram', label: 'Ver reel en Instagram', url: 'https://www.instagram.com/reel/DdkIQhohNw1/?dlrf=eHc4Ymt6cmFtZzEy' },
    { id: 'ig-2', platform: 'instagram', label: 'Ver reel en Instagram', url: 'https://www.instagram.com/reel/DdkCpFTTljL/?rpxt=MTBnejBoMTYxa2x6Yg==' },
    { id: 'ig-3', platform: 'instagram', label: 'Ver reel en Instagram', url: 'https://www.instagram.com/reel/DdSvAoHs2v6/?rpxt=ZzJ0N2E3cTEwM2Vq' },
    { id: 'ig-4', platform: 'instagram', label: 'Ver reel en Instagram', url: 'https://www.instagram.com/reel/DdNSLi0MUp_/?psln=MWM0N3duZHdkcnI3Zg==' },
    { id: 'tt-1', platform: 'tiktok', label: 'Ver video en TikTok', url: 'https://vt.tiktok.com/ZSbTep7fX/' },
    { id: 'tt-2', platform: 'tiktok', label: 'Ver video en TikTok', url: 'https://vt.tiktok.com/ZSbTddpu1/' },
    { id: 'tt-3', platform: 'tiktok', label: 'Ver video en TikTok', url: 'https://vt.tiktok.com/ZSbTdry59/' },
    { id: 'yt-1', platform: 'youtube', label: 'Ver transmisión en YouTube', url: 'https://www.youtube.com/live/OzjQSu3R8to?si=PTL1_hhU0pFF7eS6', youtubeId: 'OzjQSu3R8to' },
    { id: 'yt-2', platform: 'youtube', label: 'Ver transmisión en YouTube', url: 'https://www.youtube.com/live/fkhBnB9v_eU?si=1VplZ9q84_DPQ0nb', youtubeId: 'fkhBnB9v_eU' },
    { id: 'yt-3', platform: 'youtube', label: 'Ver transmisión en YouTube', url: 'https://www.youtube.com/live/uWWit2ONDlg?si=PboRKgdYI1gwh8Fy', youtubeId: 'uWWit2ONDlg' }
  ];

  const ROUTES = {
    home: '/',
    noticias: '/noticias',
    programas: '/programas',
    historia: '/historia',
    equipo: '/equipo',
    comercial: '/comercial',
    contacto: '/contacto',
    legal: '/legal'
  };

  const HASH_VIEWS = {
    '#home': 'home',
    '#noticias': 'noticias',
    '#programas': 'programas',
    '#historia': 'historia',
    '#equipo': 'equipo',
    '#comercial': 'comercial',
    '#contacto': 'contacto'
  };

  const META = {
    home: [
      'Voz de Potrero — El deporte nace en el barrio',
      'Historias, deportes y comunidad contadas desde donde todo empieza. Medio deportivo de Rosario.'
    ],
    noticias: [
      'Noticias y coberturas — Voz de Potrero',
      'Historias y coberturas deportivas contadas desde Rosario y sus barrios.'
    ],
    programas: [
      'Programas y contenidos — Voz de Potrero',
      'Transmisiones, reels y videos de los canales oficiales de Voz de Potrero.'
    ],
    historia: [
      'Historia — Voz de Potrero',
      'El origen, el crecimiento y la vuelta a las raíces de Voz de Potrero.'
    ],
    equipo: [
      'Equipo — Voz de Potrero',
      'Las personas detrás de Voz de Potrero.'
    ],
    comercial: [
      'Propuestas para marcas — Voz de Potrero',
      'Coberturas deportivas, transmisiones y producciones audiovisuales para marcas.'
    ],
    contacto: [
      'Contacto — Voz de Potrero',
      'Contacto directo para propuestas comerciales, colaboraciones y otras consultas.'
    ],
    articulo: [
      'Noticia — Voz de Potrero',
      'Publicación de Voz de Potrero.'
    ],
    legal: [
      'Información legal — Voz de Potrero',
      'Información sobre privacidad, contenidos y enlaces externos.'
    ],
    notfound: [
      'Página no encontrada — Voz de Potrero',
      'La página que buscás no está disponible.'
    ]
  };

  const views = new Map(
    $$('.view[data-view]').map((view) => [view.dataset.view, view])
  );

  const header = $('#site-header');
  const nav = $('#main-nav');
  const menuButton = $('#menu-btn');
  const shell = $('#app-shell');

  let activeView = null;
  let currentArticleSlug = '';
  let csrfToken = '';
  let articleRequest = 0;
  let newsLoaded = false;
  let programsLoaded = false;
  let mediaLoaded = false;
  let teamLoaded = false;
  let switchTimers = [];
  const entranceAnimations = [];

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function clearTimers() {
    switchTimers.forEach(window.clearTimeout);
    switchTimers = [];
  }

  function safeExternalURL(value) {
    if (typeof value !== 'string') return '';
    try {
      const url = new URL(value);
      const allowedHosts = [
        'instagram.com',
        'www.instagram.com',
        'tiktok.com',
        'www.tiktok.com',
        'vt.tiktok.com',
        'youtube.com',
        'www.youtube.com',
        'youtube-nocookie.com',
        'www.youtube-nocookie.com'
      ];

      return url.protocol === 'https:' && allowedHosts.includes(url.hostname)
        ? url.href
        : '';
    } catch (_) {
      return '';
    }
  }

  async function api(path, options) {
    let response;

    try {
      response = await fetch(path, {
        credentials: 'same-origin',
        ...(options || {})
      });
    } catch (_) {
      const error = new Error('No pudimos conectar con el servidor.');
      error.network = true;
      throw error;
    }

    let data = null;
    try {
      data = await response.json();
    } catch (_) {
      // Las respuestas sin JSON se consideran respuestas vacías.
    }

    if (!response.ok) {
      const error = new Error(
        (data && data.error) || 'No pudimos completar la solicitud.'
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  async function getCSRF(force) {
    if (!csrfToken || force) {
      const data = await api('/api/csrf', { method: 'GET' });
      csrfToken = data.token || '';
      if (!csrfToken) throw new Error('No pudimos preparar el formulario.');
    }

    return csrfToken;
  }

  async function postJSON(path, body, retried) {
    const token = await getCSRF();

    try {
      return await api(path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token
        },
        body: JSON.stringify(body)
      });
    } catch (error) {
      if (
        error.status === 403 &&
        /csrf/i.test(error.message) &&
        !retried
      ) {
        await getCSRF(true);
        return postJSON(path, body, true);
      }

      throw error;
    }
  }

  function parseURL(url) {
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (
      (path === '/' || path === '/index.html') &&
      HASH_VIEWS[url.hash]
    ) {
      return { view: HASH_VIEWS[url.hash], url };
    }

    if (path === '/' || path === '/index.html') {
      return { view: 'home', url };
    }

    for (const [view, route] of Object.entries(ROUTES)) {
      if (path === route) {
        return { view, url };
      }
    }

    const article = path.match(/^\/noticias\/([a-z0-9-]{1,80})$/);

    if (article) {
      return { view: 'articulo', slug: article[1], url };
    }

    return { view: 'notfound', url };
  }

  function routeFromLocation() {
    return parseURL(new URL(window.location.href));
  }

  function applyMeta(viewName, url) {
    const details = META[viewName] || META.notfound;
    document.title = details[0];

    const description = $('meta[name="description"]');
    if (description) description.setAttribute('content', details[1]);

    const canonical = $('link[rel="canonical"]');
    if (canonical && url) {
      const canonicalPath = url.pathname.replace(/\/+$/, '') || '/';
      canonical.setAttribute('href', canonicalPath);
    }
  }

  function updateNav(viewName) {
    const navView = viewName === 'articulo' ? 'noticias' : viewName;

    $$('[data-nav]', header).forEach((link) => {
      if (link.dataset.nav === navView) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function setMenu(open, restoreFocus) {
    if (!nav || !menuButton) return;

    nav.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');

    if (open) {
      const first = $('a', nav);
      if (first) first.focus();
    } else if (restoreFocus) {
      menuButton.focus();
    }
  }

  function switchView(name, options) {
    const settings = options || {};
    const destination = views.get(name) || views.get('notfound');
    if (!destination) return;

    const actualName = destination.dataset.view;
    const previous = activeView;

    clearTimers();

    if (previous && previous !== destination) {
      previous.inert = true;
      previous.setAttribute('aria-hidden', 'true');
      previous.classList.remove('view--entering', 'view--leaving');

      if (!reduceMotion.matches) {
        previous.classList.add('view--leaving');

        switchTimers.push(window.setTimeout(() => {
          if (activeView !== previous) {
            previous.hidden = true;
            previous.classList.remove('is-active', 'view--leaving');
          }
        }, 260));
      } else {
        previous.hidden = true;
        previous.classList.remove('is-active');
      }
    }

    destination.hidden = false;
    destination.inert = false;
    destination.setAttribute('aria-hidden', 'false');
    destination.classList.remove('view--leaving');
    destination.classList.add('is-active');

    activeView = destination;
    updateNav(actualName);
    applyMeta(actualName, settings.url || new URL(window.location.href));
    setMenu(false, false);

    const scrollPanel = $('.panel-scroll', destination);
    if (scrollPanel && settings.keepScroll !== true) {
      scrollPanel.scrollTop = 0;
    }

    if (actualName === 'noticias') loadNews();
    if (actualName === 'programas') {
      loadPrograms();
      loadMedia();
    }
    if (actualName === 'equipo') loadTeam();
    if (actualName === 'articulo') {
      loadArticle(settings.slug || currentArticleSlug);
    }

    if (!reduceMotion.matches && previous !== destination) {
      destination.classList.remove('view--entering');
      void destination.offsetWidth;
      destination.classList.add('view--entering');

      switchTimers.push(window.setTimeout(() => {
        destination.classList.remove('view--entering');
      }, 1300));
    }

    if (settings.focus !== false) {
      const heading = $('h1[tabindex="-1"]', destination) || $('h1', destination);
      if (heading) {
        window.setTimeout(() => heading.focus({ preventScroll: true }), reduceMotion.matches ? 0 : 80);
      }
    }
  }

  function navigate(name, options) {
    const settings = options || {};
    let target = name;
    if (!views.has(target)) target = 'notfound';

    const path = settings.path || ROUTES[target] || '/';
    let destinationURL;

    try {
      destinationURL = new URL(path, window.location.origin);
    } catch (_) {
      destinationURL = new URL(ROUTES[target] || '/', window.location.origin);
    }

    if (settings.reason && target === 'contacto') {
      destinationURL.searchParams.set('motivo', settings.reason);
    }

    if (settings.slug && target === 'articulo') {
      currentArticleSlug = settings.slug;
      destinationURL.pathname = '/noticias/' + encodeURIComponent(settings.slug);
    }

    const newAddress = destinationURL.pathname + destinationURL.search + destinationURL.hash;
    const oldAddress = window.location.pathname + window.location.search + window.location.hash;

    if (settings.push !== false && newAddress !== oldAddress) {
      window.history.pushState({ view: target }, '', newAddress);
    }

    if (target === 'contacto') {
      const reason = settings.reason || destinationURL.searchParams.get('motivo');
      setContactReason(reason);
    }

    if (target === 'articulo') {
      currentArticleSlug = settings.slug || currentArticleSlug;
    }

    switchView(target, {
      focus: settings.focus,
      slug: currentArticleSlug,
      url: destinationURL
    });
  }

  function setContactReason(reason) {
    const select = $('#contact-reason');
    if (!select) return;

    const accepted = ['Propuesta comercial', 'Trabajar con nosotros', 'Otro'];
    if (accepted.includes(reason)) select.value = reason;
  }

  function closeMenuIfOutside(event) {
    if (
      nav &&
      menuButton &&
      nav.classList.contains('is-open') &&
      !header.contains(event.target)
    ) {
      setMenu(false, false);
    }
  }

  document.addEventListener('click', (event) => {
    closeMenuIfOutside(event);

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const link = event.target.closest('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;

    let url;
    try {
      url = new URL(link.href, window.location.href);
    } catch (_) {
      return;
    }

    if (url.origin !== window.location.origin) return;

    const declaredView = link.dataset.nav;
    if (declaredView && views.has(declaredView)) {
      event.preventDefault();
      navigate(declaredView, {
        path: url.pathname + url.search + url.hash,
        reason: link.dataset.reason || url.searchParams.get('motivo') || '',
        slug: declaredView === 'articulo' ? currentArticleSlug : undefined
      });
      return;
    }

    const route = parseURL(url);
    if (route.view === 'notfound') return;

    event.preventDefault();

    navigate(route.view, {
      path: url.pathname + url.search + url.hash,
      slug: route.slug,
      reason: url.searchParams.get('motivo') || ''
    });
  });

  if (menuButton) {
    menuButton.addEventListener('click', () => {
      setMenu(menuButton.getAttribute('aria-expanded') !== 'true', true);
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav && nav.classList.contains('is-open')) {
      event.preventDefault();
      setMenu(false, true);
      return;
    }

    if (
      event.key === 'Tab' &&
      nav &&
      nav.classList.contains('is-open') &&
      menuButton
    ) {
      const focusable = [menuButton, ...$$('a', nav)];
      const index = focusable.indexOf(document.activeElement);

      if (event.shiftKey && index <= 0) {
        event.preventDefault();
        focusable[focusable.length - 1].focus();
      } else if (!event.shiftKey && index === focusable.length - 1) {
        event.preventDefault();
        focusable[0].focus();
      }
    }
  });

  window.addEventListener('popstate', () => {
    const route = routeFromLocation();
    if (route.view === 'articulo') currentArticleSlug = route.slug;
    if (route.view === 'contacto') {
      setContactReason(route.url.searchParams.get('motivo'));
    }

    switchView(route.view, {
      focus: false,
      slug: route.slug,
      url: route.url
    });
  });

  window.addEventListener('hashchange', () => {
    if (window.location.pathname !== '/') return;
    const route = routeFromLocation();
    if (HASH_VIEWS[window.location.hash]) {
      switchView(route.view, { focus: false, url: route.url });
    }
  });

  /* =======================================================
     NOTICIAS
     ======================================================= */

  function isDemoArticle(item) {
    const title = String(item.title || '');
    const summary = String(item.summary || item.excerpt || '');

    return item.demo === true ||
      /^\s*\[?\s*demo\s*\]?/i.test(title) ||
      /nota de ejemplo|texto de demostración|contenido de demostración|registro demostrativo/i.test(title + ' ' + summary);
  }

  function formatDate(value) {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  function renderEmptyState(container, heading, message) {
    container.replaceChildren();

    const box = make('div', 'empty-state');
    box.appendChild(make('p', 'eyebrow', 'Voz de Potrero'));
    box.appendChild(make('h2', '', heading));
    box.appendChild(make('p', '', message));

    const actions = make('div', 'empty-state-actions');

    const programs = make('a', '', 'Explorar contenidos audiovisuales ↗');
    programs.href = '/programas';
    programs.dataset.nav = 'programas';
    actions.appendChild(programs);

    [
      ['Instagram', PROFILE.instagram],
      ['TikTok', PROFILE.tiktok],
      ['YouTube', PROFILE.youtube]
    ].forEach(([label, url]) => {
      const link = make('a', '', label + ' ↗');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      actions.appendChild(link);
    });

    box.appendChild(actions);
    container.appendChild(box);
  }

  async function loadNews(force) {
    const container = $('#news-list');
    if (!container || (newsLoaded && !force)) return;

    container.setAttribute('aria-busy', 'true');
    container.replaceChildren(make('p', 'loading-state', 'Cargando publicaciones…'));

    try {
      const result = await api('/api/news');
      const items = Array.isArray(result.items) ? result.items : [];
      const published = items.filter((item) =>
        item &&
        item.status !== 'draft' &&
        !isDemoArticle(item) &&
        typeof item.title === 'string' &&
        item.title.trim().length >= 3 &&
        /^[a-z0-9-]{1,80}$/.test(String(item.slug || ''))
      );

      newsLoaded = true;
      container.replaceChildren();

      if (!published.length) {
        renderEmptyState(
          container,
          'Estamos preparando nuevas historias.',
          'Mientras tanto, encontrá nuestras coberturas y producciones en los canales oficiales.'
        );
        return;
      }

      published.forEach((item) => {
        const link = make('a', 'story-card');
        link.href = '/noticias/' + item.slug;

        link.appendChild(make('span', 'story-category', item.category || 'Cobertura'));
        link.appendChild(make('h2', '', item.title));

        const summary = String(item.summary || '').trim();
        if (summary) link.appendChild(make('p', '', summary));

        const date = formatDate(item.date);
        if (date) {
          const time = make('time', '', date);
          time.dateTime = item.date;
          link.appendChild(time);
        }

        container.appendChild(link);
      });
    } catch (error) {
      const box = make('div', 'empty-state');
      box.appendChild(make('h2', '', 'No pudimos cargar las noticias.'));
      box.appendChild(make('p', '', 'Revisá tu conexión e intentá nuevamente.'));

      const retry = make('button', 'hero-secondary', 'Reintentar');
      retry.type = 'button';
      retry.addEventListener('click', () => loadNews(true));
      box.appendChild(retry);

      container.replaceChildren(box);
      console.warn('[Voz de Potrero] Error al cargar noticias:', error.message);
    } finally {
      container.setAttribute('aria-busy', 'false');
    }
  }

  async function loadArticle(slug) {
    if (!slug) return;

    const request = ++articleRequest;
    const title = $('#art-title');
    const meta = $('#art-meta');
    const summary = $('#art-summary');
    const body = $('#art-body');

    if (!title || !body) return;

    title.textContent = 'Cargando publicación…';
    meta.textContent = 'Noticias';
    summary.textContent = '';
    body.replaceChildren();

    try {
      const item = await api('/api/news/' + encodeURIComponent(slug));
      if (request !== articleRequest) return;

      if (isDemoArticle(item) || item.status === 'draft') {
        navigate('noticias');
        return;
      }

      title.textContent = item.title || 'Publicación';
      meta.textContent = [item.category, formatDate(item.date)].filter(Boolean).join(' · ');
      summary.textContent = item.summary || '';
      body.replaceChildren();

      String(item.body || '')
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .forEach((paragraph) => {
          if (paragraph.startsWith('## ')) {
            body.appendChild(make('h2', '', paragraph.slice(3).trim()));
          } else {
            body.appendChild(make('p', '', paragraph.replace(/^#+\s*/, '')));
          }
        });

      if (!body.childElementCount) {
        body.appendChild(make('p', '', 'Esta publicación todavía no tiene texto disponible.'));
      }

      document.title = (item.title || 'Noticia') + ' — Voz de Potrero';
    } catch (error) {
      if (request !== articleRequest) return;

      title.textContent = error.status === 404
        ? 'Esta publicación no está disponible.'
        : 'No pudimos cargar la publicación.';

      summary.textContent = 'Volvé a noticias para explorar el contenido publicado.';
      body.replaceChildren();

      const back = make('a', 'hero-secondary', 'Volver a noticias ↗');
      back.href = '/noticias';
      back.dataset.nav = 'noticias';
      body.appendChild(back);
    }
  }

  /* =======================================================
     PROGRAMAS Y MULTIMEDIA
     ======================================================= */

  function youtubeId(item) {
    if (typeof item.youtubeId === 'string' && /^[A-Za-z0-9_-]{11}$/.test(item.youtubeId)) {
      return item.youtubeId;
    }

    const url = safeExternalURL(item.url);
    if (!url) return '';

    try {
      const parsed = new URL(url);
      const match = parsed.pathname.match(/\/(?:live|shorts|embed)\/([A-Za-z0-9_-]{11})/);
      return match ? match[1] : '';
    } catch (_) {
      return '';
    }
  }

  function platformIcon(platform, className) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    if (className) svg.setAttribute('class', className);

    if (platform === 'instagram') {
      svg.innerHTML = '<rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.7" r="1" fill="currentColor"></circle>';
    } else if (platform === 'tiktok') {
      svg.innerHTML = '<path d="M14 3v11.1a4.1 4.1 0 1 1-3.8-4.1"></path><path d="M14 3c.4 3.1 2.3 5 5.5 5.3"></path>';
    } else {
      svg.innerHTML = '<path class="icon-fill" d="M23 7.1a3 3 0 0 0-2.1-2.1C19.1 4.5 12 4.5 12 4.5s-7.1 0-8.9.5A3 3 0 0 0 1 7.1 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.9A3 3 0 0 0 3.1 19c1.8.5 8.9.5 8.9.5s7.1 0 8.9-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 23.5 12a31 31 0 0 0-.5-4.9ZM9.7 15.6V8.4l6.2 3.6-6.2 3.6Z"></path>';
    }

    return svg;
  }

  async function retrieveMedia() {
    try {
      const result = await api('/api/media');
      const items = Array.isArray(result.items) ? result.items : [];

      const safeItems = items.filter((item) =>
        item &&
        ['instagram', 'tiktok', 'youtube'].includes(item.platform) &&
        safeExternalURL(item.url)
      );

      if (safeItems.length >= 10) return safeItems;
    } catch (error) {
      console.warn('[Voz de Potrero] Se utilizarán los enlaces multimedia locales:', error.message);
    }

    return MEDIA_FALLBACK.slice();
  }

  function makeMediaCard(item) {
    const url = safeExternalURL(item.url);
    const platform = item.platform;
    const card = make('article', 'media-card');
    card.dataset.platform = platform;

    const stage = make('div', 'media-stage');
    stage.appendChild(platformIcon(platform, 'media-platform-icon'));

    const title = platform === 'youtube'
      ? 'Ver transmisión en YouTube'
      : platform === 'instagram'
        ? 'Ver reel en Instagram'
        : 'Ver video en TikTok';

    const id = platform === 'youtube' ? youtubeId(item) : '';

    if (id) {
      const play = make('button', 'media-play', 'Reproducir');
      play.type = 'button';
      play.setAttribute('aria-label', 'Reproducir transmisión en YouTube');
      play.addEventListener('click', () => {
        const iframe = document.createElement('iframe');
        iframe.className = 'media-player';
        iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0';
        iframe.title = 'Reproducción de YouTube';
        iframe.loading = 'lazy';
        iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        stage.replaceChildren(iframe);
      });
      stage.appendChild(play);
    } else {
      const open = make('a', 'media-open', title + ' ↗');
      open.href = url;
      open.target = '_blank';
      open.rel = 'noopener noreferrer';
      stage.appendChild(open);
    }

    card.appendChild(stage);
    card.appendChild(make('h3', '', title));

    const description = platform === 'youtube'
      ? 'Abrí la transmisión original en YouTube.'
      : platform === 'instagram'
        ? 'Publicación original en la cuenta de Instagram.'
        : 'Video original en la plataforma TikTok.';

    card.appendChild(make('p', 'media-description', description));

    const original = make('a', 'media-original', 'Ver original ↗');
    original.href = url;
    original.target = '_blank';
    original.rel = 'noopener noreferrer';
    original.setAttribute('aria-label', title);
    card.appendChild(original);

    return card;
  }

  async function loadMedia(force) {
    const container = $('#media-groups');
    if (!container || (mediaLoaded && !force)) return;

    container.setAttribute('aria-busy', 'true');
    container.replaceChildren(make('p', 'loading-state', 'Cargando contenidos audiovisuales…'));

    const items = await retrieveMedia();
    const platforms = [
      { key: 'youtube', title: 'Transmisiones en YouTube' },
      { key: 'instagram', title: 'Reels de Instagram' },
      { key: 'tiktok', title: 'Videos de TikTok' }
    ];

    container.replaceChildren();

    platforms.forEach((platform) => {
      const group = make('section', 'media-group');
      const heading = make('header', 'media-group-heading');
      heading.appendChild(platformIcon(platform.key, ''));
      heading.appendChild(make('h2', '', platform.title));
      group.appendChild(heading);

      const grid = make('div', 'media-grid');
      items
        .filter((item) => item.platform === platform.key)
        .forEach((item) => grid.appendChild(makeMediaCard(item)));

      group.appendChild(grid);
      container.appendChild(group);
    });

    mediaLoaded = true;
    container.setAttribute('aria-busy', 'false');
  }

  async function loadPrograms() {
    const container = $('#program-list');
    if (!container || programsLoaded) return;

    programsLoaded = true;
    container.replaceChildren();

    try {
      const result = await api('/api/programs');
      const items = Array.isArray(result.items) ? result.items : [];

      items
        .filter((item) =>
          item &&
          item.demo !== true &&
          !isDemoArticle(item) &&
          item.title &&
          item.url &&
          safeExternalURL(item.url)
        )
        .forEach((item) => {
          const card = make('article', 'program-card');
          card.appendChild(make('h2', '', item.title));

          if (item.summary) card.appendChild(make('p', '', item.summary));

          const link = make('a', '', 'Ver producción ↗');
          link.href = safeExternalURL(item.url);
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          card.appendChild(link);
          container.appendChild(card);
        });
    } catch (error) {
      programsLoaded = false;
      console.warn('[Voz de Potrero] No se pudieron cargar los programas:', error.message);
    }
  }

  /* =======================================================
     EQUIPO
     ======================================================= */

  function initials(name) {
    return String(name)
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => Array.from(part)[0] || '')
      .join('')
      .toUpperCase();
  }

  function loadTeam() {
    const container = $('#team-list');
    if (!container || teamLoaded) return;

    const names = [
      'Santiago Sancanella',
      'Tomás Murciano',
      'Lucas Calatroni',
      'Thiago Mellano'
    ];

    container.replaceChildren();

    names.forEach((name) => {
      const card = make('article', 'member-card');
      card.appendChild(make('div', 'member-initials', initials(name)));
      card.appendChild(make('h2', '', name));
      container.appendChild(card);
    });

    teamLoaded = true;
  }

  /* =======================================================
     CONTACTO
     ======================================================= */

  function getContactValues(form) {
    return {
      nombre: String(form.elements.nombre.value || '').trim(),
      email: String(form.elements.email.value || '').trim(),
      motivo: String(form.elements.motivo.value || 'Otro'),
      mensaje: String(form.elements.mensaje.value || '').trim(),
      website: String(form.elements.website.value || '')
    };
  }

  function setFieldError(form, name, message) {
    const field = form.elements[name];
    const error = $('[data-error-for="' + name + '"]', form);

    if (field && typeof field.setAttribute === 'function') {
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
    }

    if (error) error.textContent = message || '';
  }

  function clearFieldErrors(form) {
    ['nombre', 'email', 'motivo', 'mensaje'].forEach((name) => {
      setFieldError(form, name, '');
    });
  }

  function validateContact(form, data) {
    const errors = {};

    if (data.nombre.length < 2) {
      errors.nombre = 'Ingresá tu nombre.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) {
      errors.email = 'Ingresá una dirección de correo válida.';
    }

    if (!['Propuesta comercial', 'Trabajar con nosotros', 'Otro'].includes(data.motivo)) {
      errors.motivo = 'Elegí un motivo de consulta.';
    }

    if (data.mensaje.length < 10) {
      errors.mensaje = 'El mensaje debe tener al menos 10 caracteres.';
    }

    Object.keys(errors).forEach((name) => {
      setFieldError(form, name, errors[name]);
    });

    return errors;
  }

  function composeMailto(data) {
    const subject = 'Consulta — Voz de Potrero: ' + data.motivo;
    const body = [
      'Nombre: ' + data.nombre,
      'Email: ' + data.email,
      'Motivo: ' + data.motivo,
      '',
      data.mensaje
    ].join('\n');

    return 'mailto:vozdepotrero10@gmail.com'
      + '?subject=' + encodeURIComponent(subject)
      + '&body=' + encodeURIComponent(body);
  }

  function showContactStatus(message, state, fallbackURL) {
    const status = $('#contact-status');
    const fallback = $('#mailto-fallback');

    if (status) {
      status.hidden = false;
      status.dataset.s = state;
      status.textContent = message;
    }

    if (fallback) {
      if (fallbackURL) {
        fallback.hidden = false;
        fallback.href = fallbackURL;
      } else {
        fallback.hidden = true;
      }
    }
  }

  const contactForm = $('#contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearFieldErrors(contactForm);
      showContactStatus('', '', '');

      const data = getContactValues(contactForm);
      const errors = validateContact(contactForm, data);

      if (Object.keys(errors).length > 0) {
        showContactStatus('Por favor, revisá los campos marcados.', 'error', '');
        return;
      }

      if (data.website) {
        showContactStatus('Mensaje enviado correctamente.', 'ok', '');
        contactForm.reset();
        return;
      }

      const submitBtn = $('#contact-submit', contactForm);
      if (submitBtn) submitBtn.disabled = true;

      showContactStatus('Enviando mensaje…', '', '');

      const mailtoURL = composeMailto(data);

      try {
        await postJSON('/api/contact', data);
        showContactStatus('¡Mensaje enviado con éxito! Nos pondremos en contacto pronto.', 'ok', '');
        contactForm.reset();
      } catch (error) {
        showContactStatus(
          error.network
            ? 'No pudimos conectar con el servidor. Podés enviar tu consulta directamente por correo.'
            : error.message || 'No pudimos enviar el mensaje.',
          'error',
          mailtoURL
        );
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

})();