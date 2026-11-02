const express = require('express');
const request = require('supertest');
const crypto = require('crypto');
const path = require('path');
const withAuth = require('../auth');
const config = { AUTH_USERNAME: 'admin', AUTH_PASSWORD_SALT: 'test-only-salt', AUTH_PASSWORD_HASH: crypto.scryptSync('test-password', 'test-only-salt', 64).toString('hex') };
function build() {
  const inner = express();
  inner.get('/api/v1/games', (req, res) => res.json({ data: [] }));
  inner.get('/health', (req, res) => res.json({ status: 'ok' }));
  return withAuth(inner, path.resolve(__dirname, '../../frontend'), config);
}
test('blocks anonymous API and redirects page; login page is available', async () => {
  const app = build();
  await request(app).get('/api/v1/games').expect(401);
  await request(app).get('/').expect(302).expect('Location', '/login');
  await request(app).get('/login').expect(200);
  await request(app).get('/health').expect(200);
});
test('wrong password rejected; valid session works; logout invalidates copied cookie', async () => {
  const app = build(), agent = request.agent(app);
  await agent.post('/api/auth/login').send({ username: 'admin', password: 'wrong' }).expect(401);
  const login = await agent.post('/api/auth/login').send({ username: 'admin', password: 'test-password' }).expect(200);
  expect(login.headers['set-cookie'][0]).toContain('HttpOnly');
  expect(login.headers['set-cookie'][0]).toContain('SameSite=Strict');
  await agent.get('/api/v1/games').expect(200);
  await agent.get('/api/auth/me').expect(200);
  await agent.post('/api/auth/logout').expect(204);
  await request(app).get('/api/v1/games').set('Cookie', login.headers['set-cookie'][0].split(';')[0]).expect(401);
});
test('expired sessions rejected', async () => {
  const app = build(), agent = request.agent(app);
  await agent.post('/api/auth/login').send({ username: 'admin', password: 'test-password' }).expect(200);
  const now = Date.now();
  const spy = jest.spyOn(Date, 'now').mockReturnValue(now + 9 * 60 * 60 * 1000);
  try { await agent.get('/api/v1/games').expect(401); } finally { spy.mockRestore(); }
});
test('rejects cross-origin login and throttles repeated failures', async () => {
  const app = build();
  await request(app).post('/api/auth/login').set('Origin', 'https://attacker.example').send({}).expect(403);
  for (let i = 0; i < 10; i++) await request(app).post('/api/auth/login').send({ username: 'admin', password: 'wrong' }).expect(401);
  await request(app).post('/api/auth/login').send({ username: 'admin', password: 'test-password' }).expect(429);
});

