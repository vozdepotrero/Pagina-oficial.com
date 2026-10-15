/* Voz de Potrero — admin.js. La autorización real se valida en el servidor en cada endpoint. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [].slice.call((r || document).querySelectorAll(s));
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  let csrf = '', me = null, mode = 'demo', editing = null;

  /* ---------- Red + CSRF ----------
     - Toda escritura (POST/PUT/DELETE) lleva X-CSRF-Token; si todavía no hay token se pide antes de enviar.
     - Si el servidor responde 403 por CSRF (token vencido o sesión renovada) se pide uno nuevo y se reintenta UNA vez.
     - Si responde 401 fuera del login, la sesión venció: se vuelve a la pantalla de ingreso. */
  async function raw(url, method, body, extra) {
    const r = await fetch(url, { method, credentials: 'same-origin', headers: Object.assign({ 'Content-Type': 'application/json' }, extra || {}), body: body ? JSON.stringify(body) : undefined });
    let d = null; try { d = await r.json(); } catch (_) { /* sin cuerpo */ }
    if (!r.ok) { const e = new Error((d && d.error) || 'Error ' + r.status); e.status = r.status; throw e; }
    return d;
  }
  async function fetchToken() { csrf = (await raw('/api/csrf', 'GET')).token; return csrf; }
  async function api(url, method, body, retried) {
    const m = (method || 'GET').toUpperCase(), write = m !== 'GET';
    if (write && !csrf) await fetchToken();
    try { return await raw(url, m, body, write ? { 'X-CSRF-Token': csrf } : null); }
    catch (e) {
      if (write && e.status === 403 && /CSRF/i.test(e.message) && !retried) { await fetchToken(); return api(url, m, body, true); }
      if (e.status === 401 && url !== '/api/admin/login' && url !== '/api/admin/me') toLogin('La sesión venció. Ingresá de nuevo.');
      throw e;
    }
  }
  const say = (box, s, m) => { box.hidden = false; box.dataset.s = s; box.textContent = m; };

  /* ---------- Pantallas ---------- */
  function toLogin(msg) {
    me = null; csrf = '';
    $('#panel').hidden = true; $('#logout').hidden = true; $('#who').hidden = true; $('#login').hidden = false;
    if (msg) say($('#login-status'), 'error', msg);
    fetchToken().catch(() => {});
  }
  async function boot() {
    try { enter(await api('/api/admin/me')); }
    catch (_) { $('#login').hidden = false; fetchToken().catch(() => {}); }
  }
  function enter(d) {
    me = d.user; mode = d.mode; csrf = d.csrf;
    $('#login').hidden = true; $('#panel').hidden = false; $('#logout').hidden = false; $('#login-status').hidden = true;
    const w = $('#who'); w.hidden = false; w.textContent = me.name + ' · ' + me.role;
    const demo = mode === 'demo';
    $('#mode-text').textContent = demo
      ? 'MODO DEMO (sin HUBSPOT_TOKEN). Las noticias de ejemplo y las consultas viven solo en la memoria del servidor: se pierden al reiniciarlo y no se sincronizan con HubSpot.'
      : 'HUBSPOT_TOKEN configurado (conexión no verificada por este panel). Este panel no edita contenidos en este modo: las noticias, programas, equipo e historia se gestionan en HubSpot (tablas HubDB) y las consultas llegan a Contactos de HubSpot.';
    // En modo HubSpot no se ofrecen formularios de edición que el servidor no implementa.
    $('[data-t=news]').hidden = !(demo && ['admin', 'editor'].includes(me.role));
    $('[data-t=inq]').hidden = !(demo && ['admin', 'comercial'].includes(me.role));
    selectTab('resumen');
  }
  function selectTab(name) {
    $$('.tab').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.t === name)));
    $$('[data-pane]').forEach((p) => { p.hidden = p.dataset.pane !== name; });
    if (name === 'news') loadNews();
    if (name === 'inq') loadInq();
  }
  $$('.tab').forEach((t) => t.addEventListener('click', () => selectTab(t.dataset.t)));

  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault(); const st = $('#login-status'); st.hidden = true; const f = e.target;
    try {
      const d = await api('/api/admin/login', 'POST', { user: f.elements.user.value, password: f.elements.password.value });
      f.reset(); enter(d);
    } catch (err) { say(st, 'error', err.message); }
  });
  $('#logout').addEventListener('click', async () => { try { await api('/api/admin/logout', 'POST', {}); } catch (_) { /* igual se recarga */ } finally { location.reload(); } });

  /* ---------- Noticias (solo modo demo) ---------- */
  async function loadNews() {
    const box = $('#news-list'); box.replaceChildren();
    try {
      const d = await api('/api/admin/news');
      if (!d.items.length) box.appendChild(el('p', 'empty', 'No hay noticias.'));
      d.items.forEach((n) => {
        const row = el('div', 'row'); const info = el('div'); info.appendChild(el('strong', null, n.title));
        info.appendChild(el('small', null, '/noticias/' + n.slug + ' · ' + (n.status === 'published' ? 'Publicada' : 'Borrador')));
        const act = el('div'); const ed = el('button', 'btn btn--ghost btn--sm', 'Editar'); ed.type = 'button';
        const del = el('button', 'btn btn--ghost btn--sm', 'Eliminar'); del.type = 'button';
        ed.addEventListener('click', () => edit(n)); del.addEventListener('click', () => remove(n));
        act.append(ed, document.createTextNode(' '), del); row.append(info, act); box.appendChild(row);
      });
    } catch (e) { if (e.status !== 401) box.appendChild(el('p', 'empty', e.message)); }
  }
  function edit(n) {
    editing = n.slug; const f = $('#news-form');
    ['title', 'slug', 'category', 'summary', 'body', 'status'].forEach((k) => { f.elements[k].value = n[k] || ''; });
    $('#nf-title').textContent = 'Editar noticia'; $('#nf-cancel').hidden = false; f.elements.title.focus();
  }
  function resetForm() { editing = null; $('#news-form').reset(); $('#nf-title').textContent = 'Nueva noticia'; $('#nf-cancel').hidden = true; }
  $('#nf-cancel').addEventListener('click', resetForm);
  $('#news-form').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target, st = $('#news-status'); st.hidden = true;
    const body = { title: f.elements.title.value, slug: f.elements.slug.value, category: f.elements.category.value, summary: f.elements.summary.value, body: f.elements.body.value, status: f.elements.status.value };
    try {
      await api(editing ? '/api/admin/news/' + encodeURIComponent(editing) : '/api/admin/news', editing ? 'PUT' : 'POST', body);
      say(st, 'ok', 'Guardado (en memoria: se pierde al reiniciar el servidor).'); resetForm(); loadNews();
    } catch (err) { if (err.status !== 401) say(st, 'error', err.message); }
  });
  async function remove(n) {
    if (!confirm('¿Eliminar «' + n.title + '»? Esta acción no se puede deshacer.')) return;
    try { await api('/api/admin/news/' + encodeURIComponent(n.slug), 'DELETE'); loadNews(); } catch (e) { if (e.status !== 401) alert(e.message); }
  }

  /* ---------- Consultas (solo modo demo) ---------- */
  async function loadInq() {
    const box = $('#inq-list'); box.replaceChildren();
    try {
      const d = await api('/api/admin/inquiries');
      if (!d.items.length) box.appendChild(el('p', 'empty', 'Todavía no hay consultas (se pierden al reiniciar el servidor).'));
      d.items.forEach((q) => {
        const c = el('div', 'card'); c.append(el('small', null, q.motivo + ' · ' + new Date(q.createdAt).toLocaleString('es-AR')), el('h3', null, q.nombre + ' — ' + q.email), el('p', null, (q.empresa ? q.empresa + ' · ' : '') + q.mensaje));
        box.appendChild(c);
      });
    } catch (e) { if (e.status !== 401) box.appendChild(el('p', 'empty', e.message)); }
  }

  boot();
})();