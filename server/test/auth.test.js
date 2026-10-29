import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, registerUser, loginUser } from './helpers.js';

let baseUrl;

describe('Authentication', async () => {
  before(async () => {
    const s = await startTestServer();
    baseUrl = s.baseUrl;
  });
  after(async () => {
    await stopTestServer();
  });

  it('registers a new user successfully', async () => {
    console.error('T1 register');
    const { res, payload } = await registerUser(baseUrl);
    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.ok(body.user);
    assert.ok(body.user._id);
    assert.strictEqual(body.user.email, payload.email);
    assert.ok(!body.user.passwordHash);
    console.error('T1 done');
  });

  it('rejects duplicate email registration', async () => {
    console.error('T2 dup start');
    const email = `dup${Date.now()}@example.com`;
    await registerUser(baseUrl, { email });
    console.error('T2 first reg done');
    const { res } = await registerUser(baseUrl, { email });
    console.error('T2 second reg status', res.status);
    assert.strictEqual(res.status, 409);
    const body = await res.json();
    assert.ok(body.error);
    console.error('T2 done');
  });

  it('rejects registration with weak password', async () => {
    console.error('T3 weak');
    const { res } = await registerUser(baseUrl, { password: 'short' });
    assert.strictEqual(res.status, 400);
    console.error('T3 done');
  });

  it('logs in with valid credentials', async () => {
    console.error('T4 login');
    const email = `login${Date.now()}@example.com`;
    const password = 'LoginPass123!';
    await registerUser(baseUrl, { email, password });
    const { res, accessToken } = await loginUser(baseUrl, email, password);
    assert.strictEqual(res.status, 200);
    assert.ok(accessToken);
    console.error('T4 done');
  });

  it('rejects invalid credentials', async () => {
    console.error('T5 invalid');
    const { res } = await loginUser(baseUrl, `nope${Date.now()}@example.com`, 'WrongPass123!');
    assert.strictEqual(res.status, 401);
    console.error('T5 done');
  });

  it('rejects login for non-existent user', async () => {
    console.error('T6 ghost');
    const { res } = await loginUser(baseUrl, `ghost${Date.now()}@example.com`, 'Pass123!');
    assert.strictEqual(res.status, 401);
    console.error('T6 done');
  });
});
