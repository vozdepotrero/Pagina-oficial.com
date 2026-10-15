'use strict';
const crypto = require('crypto');

/* ===== Configuración multimedia: las diez URLs originales, completas y sin modificar ===== */
const MEDIA = [
  { id: 'ig-1', platform: 'instagram', label: 'Reel de Instagram', url: 'https://www.instagram.com/reel/DdkIQhohNw1/?dlrf=eHc4Ymt6cmFtZzEy' },
  { id: 'ig-2', platform: 'instagram', label: 'Reel de Instagram', url: 'https://www.instagram.com/reel/DdkCpFTTljL/?rpxt=MTBnejBoMTYxa2x6Yg==' },
  { id: 'ig-3', platform: 'instagram', label: 'Reel de Instagram', url: 'https://www.instagram.com/reel/DdSvAoHs2v6/?rpxt=ZzJ0N2E3cTEwM2Vq' },
  { id: 'ig-4', platform: 'instagram', label: 'Reel de Instagram', url: 'https://www.instagram.com/reel/DdNSLi0MUp_/?psln=MWM0N3duZHdkcnI3Zg==' },
  { id: 'tt-1', platform: 'tiktok', label: 'Video de TikTok', url: 'https://vt.tiktok.com/ZSbTep7fX/' },
  { id: 'tt-2', platform: 'tiktok', label: 'Video de TikTok', url: 'https://vt.tiktok.com/ZSbTddpu1/' },
  { id: 'tt-3', platform: 'tiktok', label: 'Video de TikTok', url: 'https://vt.tiktok.com/ZSbTdry59/' },
  { id: 'yt-1', platform: 'youtube', label: 'Transmisión de YouTube', url: 'https://www.youtube.com/live/OzjQSu3R8to?si=PTL1_hhU0pFF7eS6', youtubeId: 'OzjQSu3R8to' },
  { id: 'yt-2', platform: 'youtube', label: 'Transmisión de YouTube', url: 'https://www.youtube.com/live/fkhBnB9v_eU?si=1VplZ9q84_DPQ0nb', youtubeId: 'fkhBnB9v_eU' },
  { id: 'yt-3', platform: 'youtube', label: 'Transmisión de YouTube', url: 'https://www.youtube.com/live/uWWit2ONDlg?si=PboRKgdYI1gwh8Fy', youtubeId: 'uWWit2ONDlg' }
];

const social = () => ({
  instagram: process.env.SOCIAL_INSTAGRAM || '',
  youtube: process.env.SOCIAL_YOUTUBE || '',
  tiktok: process.env.SOCIAL_TIKTOK || ''
});

const TOKEN = process.env.HUBSPOT_TOKEN || '';
const mode = TOKEN ? 'hubspot' : 'demo';

/* Error con estado HTTP pensado para el cliente. Cualquier otro error se responde como 502 genérico. */
const httpError = (status, msg) => { const e = new Error(msg); e.http = status; return e; };

const slugify = (s) => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

/* ===== Datos de DEMOSTRACIÓN (en memoria; se pierden al reiniciar el servidor) ===== */
const demo = {
  news: [
    { slug: 'nota-de-ejemplo-1', title: '[DEMO] Nota de ejemplo para probar el diseño', summary: 'Contenido de demostración. Se reemplaza por publicaciones reales.', body: 'Este es un texto de demostración.\n\nLas notas reales se cargan desde HubSpot o desde el panel en modo demo.', category: 'Demostración', date: new Date('2026-01-01').toISOString(), status: 'published', demo: true },
    { slug: 'nota-de-ejemplo-2', title: '[DEMO] Segunda nota de ejemplo', summary: 'Otro texto de demostración para ver la grilla editorial.', body: 'Texto de demostración.', category: 'Demostración', date: new Date('2026-01-02').toISOString(), status: 'published', demo: true }
  ],
  programs: [],
  team: [
    { name: '[DEMO] Nombre y apellido', role: 'Rol a definir', bio: 'Perfil de demostración.', demo: true },
    { name: '[DEMO] Nombre y apellido', role: 'Rol a definir', bio: 'Perfil de demostración.', demo: true }
  ],
  // Historia: hechos aportados por el equipo (sin fechas). 'pending' marca lo que falta completar con datos documentados.
  history: [
    { year: 'Origen', title: 'Un lugar para formarse', text: 'Voz de Potrero nació para dar espacio y experiencia a personas que se estaban formando y no encontraban oportunidades en los medios tradicionales.', pending: true },
    { year: 'Crecimiento', title: 'El proyecto creció', text: 'El proyecto fue creciendo.', pending: true },
    { year: 'Vuelta a las raíces', title: 'Recuperar lo que le dio origen', text: 'Después volvió a sus raíces, recuperando aquello que le dio origen.', pending: true }
  ],
  inquiries: []
};

/* ===== HubSpot (LECTURA de HubDB + alta de contactos). NO verificado contra una cuenta real. ===== */
const TABLES = { news: process.env.HUBDB_NEWS, programs: process.env.HUBDB_PROGRAMS, team: process.env.HUBDB_TEAM, history: process.env.HUBDB_HISTORY };
const cache = new Map();

async function hs(path, opt = {}) {
  const r = await fetch('https://api.hubapi.com' + path, {
    ...opt,
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json', ...(opt.headers || {}) }
  });
  if (!r.ok) {
    const e = new Error('HubSpot respondió ' + r.status); // error de origen: nunca se reenvía su estado al cliente
    e.upstream = r.status; e.body = await r.text().catch(() => '');
    throw e;
  }
  return r.status === 204 ? null : r.json();
}

async function hubRows(name) {
  const id = TABLES[name];
  if (!id) return [];
  const c = cache.get(name);
  if (c && Date.now() - c.t < 60000) return c.v;
  const d = await hs('/cms/v3/hubdb/tables/' + encodeURIComponent(id) + '/rows?limit=100');
  const v = (d.results || []).map((r) => r.values || {});
  cache.set(name, { t: Date.now(), v });
  return v;
}

// HubDB devuelve las columnas de selección como objetos {id, name, type}; se desempaquetan.
function val(x) {
  if (Array.isArray(x)) return x.map(val).join(', ');
  if (x && typeof x === 'object') return x.name != null ? x.name : (x.label != null ? x.label : '');
  return x;
}
const str = (x, n) => { const v = val(x); return String(v == null ? '' : v).slice(0, n); };
const isoDate = (x) => { const d = new Date(typeof x === 'number' ? x : String(val(x) || '')); return isNaN(d) ? '' : d.toISOString(); };
const httpsUrl = (x) => { const u = str(x, 500); return /^https:\/\//.test(u) ? u : ''; };

const mappers = {
  news: (r) => ({ slug: slugify(str(r.slug, 80) || str(r.title, 80)), title: str(r.title, 140), summary: str(r.summary, 300), body: str(r.body, 10000), category: str(r.category, 40), date: isoDate(r.date), status: str(r.status || 'published', 20).toLowerCase() }),
  programs: (r) => ({ slug: slugify(str(r.slug, 80) || str(r.title, 80)), title: str(r.title, 140), summary: str(r.summary, 400), url: httpsUrl(r.url) }),
  team: (r) => ({ name: str(r.name, 100), role: str(r.role, 100), bio: str(r.bio, 600), photo: httpsUrl(r.photo) }),
  history: (r) => ({ year: str(r.year, 20), title: str(r.title, 140), text: str(r.text, 800), pending: false })
};

// Estado de una colección: 'unconfigured' = hay HubSpot pero falta indicar su tabla HubDB (no es un error).
const status = (name) => (mode === 'hubspot' && !TABLES[name] && name !== 'history' ? 'unconfigured' : 'ok');

async function list(name) {
  if (mode === 'demo') return demo[name].filter((x) => x.status !== 'draft');
  if (name === 'history' && !TABLES.history) return demo.history; // sin tabla propia, se usa la base documentada
  return (await hubRows(name)).map(mappers[name]).filter((x) => x.status !== 'draft' && (x.slug || x.title || x.name));
}

async function newsBySlug(slug) {
  return (await list('news')).find((n) => n.slug === slug) || null;
}

async function createInquiry(d) {
  if (mode === 'demo') {
    demo.inquiries.unshift({ id: crypto.randomUUID(), ...d, createdAt: new Date().toISOString(), demo: true });
    return;
  }
  // 'message' es una propiedad estándar de contactos en HubSpot; verificar en la cuenta real.
  const props = { email: d.email, firstname: d.nombre, company: d.empresa || '', message: '[' + d.motivo + '] ' + d.mensaje };
  try {
    await hs('/crm/v3/objects/contacts', { method: 'POST', body: JSON.stringify({ properties: props }) });
  } catch (e) {
    const m = e.upstream === 409 && /Existing ID: (\d+)/.exec(e.body || '');
    if (!m) throw e;
    await hs('/crm/v3/objects/contacts/' + m[1], { method: 'PATCH', body: JSON.stringify({ properties: props }) });
  }
}

/* ===== Administración: SOLO modo demo. Con HubSpot conectado la edición se hace en HubSpot. ===== */
const onlyDemo = (what) => httpError(501, 'Con HubSpot conectado, ' + what + ' se gestiona en HubSpot. Este panel no lo modifica.');
const demoNews = () => { if (mode !== 'demo') throw onlyDemo('las noticias'); return demo.news; };

function adminNews() { return demoNews(); }

function saveNews(v, current) {
  const arr = demoNews();
  if (arr.some((n) => n.slug === v.slug && n.slug !== current)) throw httpError(409, 'Ya existe una nota con ese slug');
  if (current) {
    const i = arr.findIndex((n) => n.slug === current);
    if (i < 0) throw httpError(404, 'Nota no encontrada');
    arr[i] = { ...arr[i], ...v, demo: true };
    return arr[i];
  }
  const n = { ...v, date: new Date().toISOString(), demo: true };
  arr.unshift(n);
  return n;
}

function deleteNews(slug) {
  const arr = demoNews(); const i = arr.findIndex((n) => n.slug === slug);
  if (i < 0) throw httpError(404, 'Nota no encontrada');
  arr.splice(i, 1);
}

function inquiries() {
  if (mode !== 'demo') throw onlyDemo('las consultas');
  return demo.inquiries;
}

module.exports = { mode, MEDIA, social, slugify, status, list, newsBySlug, createInquiry, adminNews, saveNews, deleteNews, inquiries };