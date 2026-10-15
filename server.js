'use strict';
const fs = require('fs');
const path = require('path');

// Carga mínima de .env (sin dependencias). Las variables ya definidas en el sistema tienen prioridad.
// Debe ejecutarse ANTES de requerir ./lib/data, que lee HUBSPOT_TOKEN al cargarse.
try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach((l) => {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
} catch (_) { /* sin .env */ }

const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const sec = require('./lib/security');
const data = require('./lib/data');

const PROD = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;
const SITE = (process.env.SITE_URL || 'http://localhost:' + PORT).replace(/\/$/, '');
const PUB = path.join(__dirname, 'public');

if (PROD && !process.env.SESSION_SECRET) { console.error('Falta SESSION_SECRET en producción.'); process.exit(1); }
const secret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY) app.set('trust proxy', /^\d+$/.test(process.env.TRUST_PROXY) ? Number(process.env.TRUST_PROXY) : process.env.TRUST_PROXY);

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false, // sin upgrade-insecure-requests: el sitio debe poder verse por http://localhost
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      styleSrcAttr: ["'unsafe-inline'"], // el HTML usa style="--t:..." para la coreografía de entrada
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      frameSrc: ['https://www.youtube-nocookie.com'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"]
    }
  }
}));
app.use(express.json({ limit: '30kb' }));

// Cookie "secure": por defecto solo con HTTPS real en producción ('auto'). Forzable con COOKIE_SECURE=true|false.
const cookieSecure = process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : (PROD ? 'auto' : false);
app.use(session({
  name: 'vp.sid', secret, resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: cookieSecure, maxAge: 1000 * 60 * 60 * 4 }
})); // MemoryStore: suficiente para desarrollo; en producción usar un store persistente.

const limit = (windowMin, max, msg, extra) => rateLimit({ windowMs: windowMin * 60000, limit: max, standardHeaders: true, legacyHeaders: false, message: { error: msg }, ...(extra || {}) });
app.use('/api', limit(15, 300, 'Demasiadas solicitudes. Probá más tarde.'));
app.use(['/api/admin', '/api/csrf'], (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
app.use('/api', sec.csrfGuard);

/* ---------- Utilidades ---------- */
const clean = (s, max) => String(s == null ? '' : s).trim().slice(0, max);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MOTIVOS = ['Prensa', 'Propuesta comercial', 'Trabajar con nosotros', 'Otro'];
// Los errores con .http se muestran al cliente; el resto (HubSpot, bugs) se responde genérico sin filtrar detalles.
// Promise.resolve().then(...) captura también las excepciones síncronas del handler.
const wrap = (fn) => (req, res) => Promise.resolve().then(() => fn(req, res)).catch((e) => {
  if (e.http) return res.status(e.http).json({ error: e.message });
  console.error('[error]', e.message);
  res.status(502).json({ error: 'No pudimos obtener los datos. Probá de nuevo.' });
});

/* ---------- API pública ---------- */
app.get('/api/csrf', (req, res) => res.json({ token: sec.csrfToken(req) }));
app.get('/api/meta', (req, res) => res.json({ mode: data.mode, social: data.social() }));
app.get('/api/media', (req, res) => res.json({ items: data.MEDIA }));
app.get('/api/news', wrap(async (req, res) => res.json({ state: data.status('news'), items: (await data.list('news')).map(({ body, ...r }) => r) })));
app.get('/api/news/:slug', wrap(async (req, res) => {
  const n = await data.newsBySlug(req.params.slug);
  if (!n) return res.status(404).json({ error: 'Nota no encontrada' });
  res.json(n);
}));
['programs', 'team', 'history'].forEach((k) => app.get('/api/' + k, wrap(async (req, res) => res.json({ state: data.status(k), items: await data.list(k) }))));

// Diagnóstico: abrir http://localhost:3000/api/health muestra si cada colección carga ('ok'), falta configurar o falla.
app.get('/api/health', wrap(async (req, res) => {
  const collections = {};
  for (const k of ['news', 'programs', 'team', 'history']) {
    try { await data.list(k); collections[k] = data.status(k); } catch (e) { collections[k] = 'error'; console.error('[health]', k, e.message); }
  }
  res.set('Cache-Control', 'no-store').json({ ok: true, mode: data.mode, collections, media: data.MEDIA.length });
}));

app.post('/api/contact', limit(60, 6, 'Enviaste varios mensajes seguidos. Probá en un rato.'), wrap(async (req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // honeypot: se responde igual para no dar pistas
  const motivo = MOTIVOS.includes(b.motivo) ? b.motivo : 'Otro';
  const detalle = clean(b.detalle, 80);
  const d = { nombre: clean(b.nombre, 100), email: clean(b.email, 120), empresa: clean(b.empresa, 120), motivo, mensaje: clean(b.mensaje, 2000) };
  const errors = {};
  if (motivo === 'Propuesta comercial' && d.empresa.length < 2) errors.empresa = 'Indicá la empresa o marca.';
  if (d.nombre.length < 2) errors.nombre = 'Ingresá tu nombre.';
  if (!EMAIL.test(d.email)) errors.email = 'Ingresá un email válido.';
  if (d.mensaje.length < 10) errors.mensaje = 'El mensaje debe tener al menos 10 caracteres.';
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Revisá los campos.', errors });
  if (detalle) d.mensaje = '[' + detalle + '] ' + d.mensaje; // el detalle viaja dentro del mensaje (lo ven el panel y HubSpot)
  await data.createInquiry(d);
  res.json({ ok: true, demo: data.mode === 'demo' });
}));

/* ---------- Administración ---------- */
app.post('/api/admin/login', limit(15, 8, 'Demasiados intentos. Esperá unos minutos.', { skipSuccessfulRequests: true }), (req, res) => {
  const list = sec.users();
  if (!list.length) return res.status(503).json({ error: 'Administración sin configurar (ADMIN_USERS).' });
  const b = req.body || {};
  const u = list.find((x) => x.name === String(b.user || '').slice(0, 100));
  const ok = sec.verify(String(b.password || '').slice(0, 200), u ? u.h : 'scrypt$00$00') && u;
  if (!ok) return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'No se pudo iniciar sesión.' });
    req.session.user = { name: u.name, role: u.role };
    res.json({ user: req.session.user, mode: data.mode, csrf: sec.csrfToken(req) });
  });
});
app.post('/api/admin/logout', (req, res) => req.session.destroy(() => { res.clearCookie('vp.sid'); res.json({ ok: true }); }));
app.get('/api/admin/me', sec.need('admin', 'editor', 'comercial'), (req, res) => res.json({ user: req.session.user, mode: data.mode, csrf: sec.csrfToken(req) }));

function newsInput(b) {
  const title = clean(b.title, 140);
  if (title.length < 3) return { error: 'El título debe tener al menos 3 caracteres.' };
  const slug = data.slugify(clean(b.slug, 80) || title);
  if (!slug) return { error: 'Slug inválido.' };
  return { v: { slug, title, summary: clean(b.summary, 300), body: clean(b.body, 10000), category: clean(b.category, 40), status: b.status === 'published' ? 'published' : 'draft' } };
}
const NEWS = sec.need('admin', 'editor');
app.get('/api/admin/news', NEWS, wrap((req, res) => res.json({ items: data.adminNews() })));
app.post('/api/admin/news', NEWS, wrap((req, res) => { const i = newsInput(req.body || {}); if (i.error) return res.status(400).json({ error: i.error }); res.status(201).json(data.saveNews(i.v, null)); }));
app.put('/api/admin/news/:slug', NEWS, wrap((req, res) => { const i = newsInput(req.body || {}); if (i.error) return res.status(400).json({ error: i.error }); res.json(data.saveNews(i.v, req.params.slug)); }));
app.delete('/api/admin/news/:slug', NEWS, wrap((req, res) => { data.deleteNews(req.params.slug); res.json({ ok: true }); }));
app.get('/api/admin/inquiries', sec.need('admin', 'comercial'), wrap((req, res) => res.json({ items: data.inquiries() })));

app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta de API inexistente' }));

/* ---------- Páginas (rutas reales; el frontend resuelve la vista) ---------- */
const PAGES = ['/', '/noticias', '/programas', '/historia', '/equipo', '/comercial', '/contacto', '/legal'];
const index = (req, res) => res.sendFile(path.join(PUB, 'index.html'));
app.get('/videos', (req, res) => res.redirect(301, '/noticias')); // la sección Videos ya no existe: su contenido vive en Noticias y Programas
app.get(['/index.html'], (req, res) => res.redirect(301, '/'));
app.get(['/admin.html'], (req, res) => res.redirect(301, '/admin'));
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get(PAGES, index);
app.get('/noticias/:slug', async (req, res) => {
  let found = /^[a-z0-9-]{1,80}$/.test(req.params.slug);
  if (found) { try { found = !!(await data.newsBySlug(req.params.slug)); } catch (_) { found = true; } } // si el origen falla, no se declara 404
  res.status(found ? 200 : 404).sendFile(path.join(PUB, 'index.html'));
});
app.get('/admin', (req, res) => { res.set('Cache-Control', 'no-store'); res.sendFile(path.join(PUB, 'admin.html')); });

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
app.get('/robots.txt', (req, res) => res.type('text/plain').send('User-agent: *\nDisallow: /admin\nDisallow: /api/\nSitemap: ' + SITE + '/sitemap.xml\n'));
app.get('/sitemap.xml', async (req, res) => {
  let urls = PAGES.slice();
  try { urls = urls.concat((await data.list('news')).filter((n) => /^[a-z0-9-]+$/.test(n.slug)).map((n) => '/noticias/' + n.slug)); } catch (_) { /* se omiten notas si falla el origen */ }
  res.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.map((u) => '<url><loc>' + esc(SITE + u) + '</loc></url>').join('') + '</urlset>');
});

app.use(express.static(PUB, { index: false, maxAge: PROD ? '7d' : 0 }));
// Cualquier otra ruta: 404 real; el frontend muestra la página de error.
app.use((req, res) => res.status(404).sendFile(path.join(PUB, 'index.html')));

// Errores no capturados (JSON mal formado, cuerpo demasiado grande, fallos internos): nunca se expone el stack.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status || err.statusCode || 500;
  const msg = status === 413 ? 'El contenido enviado es demasiado grande.' : status < 500 ? 'Solicitud inválida.' : 'Error interno del servidor.';
  if (status >= 500) console.error('[error]', err.message);
  if (req.path.startsWith('/api')) return res.status(status).json({ error: msg });
  res.status(status).type('text/plain').send(msg);
});

app.listen(PORT, () => {
  console.log('Voz de Potrero en http://localhost:' + PORT + '  |  modo: ' + data.mode.toUpperCase());
  if (data.mode === 'demo') console.log('Sin HUBSPOT_TOKEN: contenido de demostración en memoria, nada se sincroniza ni se conserva al reiniciar.');
  if (!sec.users().length) console.log('ADMIN_USERS vacío: /admin no permite iniciar sesión hasta configurarlo.');
});