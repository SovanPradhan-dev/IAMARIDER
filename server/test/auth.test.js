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
    const { res, payload } = await registerUser(baseUrl);
    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.ok(body.user);
    assert.ok(body.user._id);
    assert.strictEqual(body.user.email, payload.email);
    assert.ok(!body.user.passwordHash);
  });

  it('rejects duplicate email registration', async () => {
    const email = `dup${Date.now()}@example.com`;
    await registerUser(baseUrl, { email });
    const { res } = await registerUser(baseUrl, { email });
    assert.strictEqual(res.status, 409);
    const body = await res.json();
    assert.ok(body.error);
  });

  it('rejects registration with weak password', async () => {
    const { res } = await registerUser(baseUrl, { password: 'short' });
    assert.strictEqual(res.status, 400);
  });

  it('logs in with valid credentials', async () => {
    const email = `login${Date.now()}@example.com`;
    const password = 'LoginPass123!';
    await registerUser(baseUrl, { email, password });
    const { res, accessToken } = await loginUser(baseUrl, email, password);
    assert.strictEqual(res.status, 200);
    assert.ok(accessToken);
  });

  it('rejects invalid credentials', async () => {
    const { res } = await loginUser(baseUrl, `nope${Date.now()}@example.com`, 'WrongPass123!');
    assert.strictEqual(res.status, 401);
  });

  it('rejects login for non-existent user', async () => {
    const { res } = await loginUser(baseUrl, `ghost${Date.now()}@example.com`, 'Pass123!');
    assert.strictEqual(res.status, 401);
  });
});
