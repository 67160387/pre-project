const express = require('express');
const crypto = require('crypto');
const path = require('path');
const { promisify } = require('util');
const scrypt = promisify(crypto.scrypt);

// Single administrator, configured locally; sessions expire after eight hours.
module.exports = function withAuth(app, frontend, config = process.env) {
  const server = express();
  const sessions = new Map(), attempts = new Map();
  const ttl = 8 * 60 * 60 * 1000;
  const cookieOptions = { httpOnly: true, sameSite: 'strict', secure: config.COOKIE_SECURE === 'true', path: '/' };
  server.use(express.json({ limit: '16kb' }));
  server.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    // Bound retained state, including expired sessions and login counters.
    const now = Date.now();
    for (const [key, item] of sessions) if (item.expires <= now) sessions.delete(key);
    for (const [key, item] of attempts) if (item.expires <= now) attempts.delete(key);
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const origin = req.get('origin');
      if ((origin && origin !== `${req.protocol}://${req.get('host')}`) || req.get('sec-fetch-site') === 'cross-site') {
        return res.status(403).json({ error: { message: 'Cross-site request rejected' } });
      }
    }
    const token = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith('bg_session='))?.slice(11);
    req.sessionToken = token;
    req.account = sessions.get(token);
    next();
  });
  server.get('/login', (req, res) => req.account ? res.redirect('/') : res.sendFile(path.join(frontend, 'login.html')));
  for (const file of ['login.js', 'style.css']) server.get('/' + file, (req, res) => res.sendFile(path.join(frontend, file)));
  server.post('/api/auth/login', async (req, res, next) => {
    try {
      if (!config.AUTH_PASSWORD_HASH || !config.AUTH_PASSWORD_SALT || !config.AUTH_USERNAME) {
        return res.status(503).json({ error: { message: 'ยังไม่ได้ตั้งค่าบัญชี กรุณารัน npm run auth:setup' } });
      }
      const key = req.socket.remoteAddress;
      const attempt = attempts.get(key) || { count: 0, expires: Date.now() + 15 * 60 * 1000 };
      if (attempt.count >= 10) return res.status(429).json({ error: { message: 'ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอ 15 นาที' } });
      attempt.count++;
      attempts.set(key, attempt);
      const { username, password } = req.body || {};
      if (typeof username !== 'string' || typeof password !== 'string' || password.length > 256) {
        return res.status(400).json({ error: { message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ถูกต้อง' } });
      }
      const actual = await scrypt(password, config.AUTH_PASSWORD_SALT, 64);
      const expected = Buffer.from(config.AUTH_PASSWORD_HASH, 'hex');
      if (username !== config.AUTH_USERNAME || expected.length !== actual.length || !crypto.timingSafeEqual(actual, expected)) {
        return res.status(401).json({ error: { message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' } });
      }
      attempts.delete(key);
      if (req.sessionToken) sessions.delete(req.sessionToken);
      const token = crypto.randomBytes(32).toString('hex');
      sessions.set(token, { username, expires: Date.now() + ttl });
      res.cookie('bg_session', token, { ...cookieOptions, maxAge: ttl });
      res.json({ data: { username } });
    } catch (error) { next(error); }
  });
  server.post('/api/auth/logout', (req, res) => {
    sessions.delete(req.sessionToken);
    res.clearCookie('bg_session', cookieOptions);
    res.status(204).end();
  });
  server.use((req, res, next) => {
    if (req.path === '/health') return next();
    if (req.account) return next();
    if (req.path.startsWith('/api/')) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'กรุณาเข้าสู่ระบบ' } });
    res.redirect('/login');
  });
  server.get('/api/auth/me', (req, res) => res.json({ data: { username: req.account.username } }));
  server.use(app);
  server.use((err, req, res, next) => res.status(err.status || 500).json({ error: { message: err.status === 400 ? 'Invalid JSON' : 'Request failed' } }));
  return server;
};
