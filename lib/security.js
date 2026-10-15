'use strict';
const crypto = require('crypto');

const ROLES = ['admin', 'editor', 'comercial'];

function hash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return 'scrypt$' + salt + '$' + crypto.scryptSync(password, salt, 64).toString('hex');
}

function verify(password, stored) {
  const [alg, salt, hex] = String(stored).split('$');
  if (alg !== 'scrypt' || !salt || !hex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hex, 'hex');
  return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
}

function users() {
  return (process.env.ADMIN_USERS || '')
    .split(';').map((x) => x.trim()).filter(Boolean)
    .map((x) => { const [name, role, h] = x.split('|'); return { name, role, h }; })
    .filter((u) => u.name && ROLES.includes(u.role) && u.h);
}

function safeEq(a, b) {
  const x = Buffer.from(String(a)); const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function csrfToken(req) {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString('hex');
  return req.session.csrf;
}

function csrfGuard(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const sent = req.get('x-csrf-token');
  if (!req.session.csrf || !sent || !safeEq(sent, req.session.csrf)) {
    return res.status(403).json({ error: 'Token CSRF inválido. Recargá la página.' });
  }
  next();
}

const need = (...roles) => (req, res, next) => {
  const u = req.session && req.session.user;
  if (!u) return res.status(401).json({ error: 'No autenticado' });
  if (!roles.includes(u.role)) return res.status(403).json({ error: 'Sin permiso para esta operación' });
  next();
};

module.exports = { hash, verify, users, csrfToken, csrfGuard, need, ROLES };