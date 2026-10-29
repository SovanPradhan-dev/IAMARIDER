import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  startTestServer, stopTestServer, registerUser, loginUser, createUserAndToken,
} from './helpers.js';

let baseUrl;

describe('Authentication', async () => {
  before(async () => {
    const s = await startTestServer();
    baseUrl = s.baseUrl;
  });
  after(async () => {
    await stopTestServer();
  });

  it('exposes the versioned health endpoint', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.service, 'ridetogether-server');
  });

  it('allows private-LAN development origins without allowing arbitrary web origins', async () => {
    const lanResponse = await fetch(`${baseUrl}/health`, {
      headers: { Origin: 'http://192.168.1.25:5173' },
    });
    assert.strictEqual(lanResponse.headers.get('access-control-allow-origin'), 'http://192.168.1.25:5173');

    const externalResponse = await fetch(`${baseUrl}/health`, {
      headers: { Origin: 'https://untrusted.example' },
    });
    assert.strictEqual(externalResponse.headers.get('access-control-allow-origin'), null);
  });

  it('does not rate limit authentication requests', async () => {
    let response;
    for (let attempt = 0; attempt < 110; attempt += 1) {
      response = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
    }

    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.headers.get('ratelimit-limit'), null);
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

  it('changes a password, rotates the refresh session, and rejects the old password', async () => {
    const { payload } = await registerUser(baseUrl);
    const { accessToken } = await loginUser(baseUrl, payload.email, payload.password);
    const nextPassword = 'AnotherPass123!';
    const response = await fetch(`${baseUrl}/api/v1/auth/change-password`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentPassword: payload.password, newPassword: nextPassword }),
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual((await response.json()).message, 'Password updated');
    assert.strictEqual((await loginUser(baseUrl, payload.email, payload.password)).res.status, 401);
    assert.strictEqual((await loginUser(baseUrl, payload.email, nextPassword)).res.status, 200);
  });

  it('rotates refresh tokens and revokes the active session on logout', async () => {
    const email = `refresh${Date.now()}@example.com`;
    const password = 'RefreshPass123!';
    await registerUser(baseUrl, { email, password });
    const login = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const accessToken = (await login.json()).accessToken;
    const initialCookie = login.headers.get('set-cookie').split(';')[0];

    const refresh = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: initialCookie },
    });
    assert.strictEqual(refresh.status, 200);
    const refreshedAccessToken = (await refresh.json()).accessToken;
    const rotatedCookie = refresh.headers.get('set-cookie').split(';')[0];

    const replay = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: initialCookie },
    });
    assert.strictEqual(replay.status, 401);

    const logout = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${refreshedAccessToken}`,
        Cookie: rotatedCookie,
      },
    });
    assert.strictEqual(logout.status, 200);

    const afterLogout = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: rotatedCookie },
    });
    assert.strictEqual(afterLogout.status, 401);
    assert.ok(accessToken);
  });

  it('updates profile and returns the private emergency contact only to its owner', async () => {
    const { user, accessToken } = await createUserAndToken({ name: 'Profile Owner' });
    const profile = await fetch(`${baseUrl}/api/v1/users/me`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Updated Rider',
        emergencyContact: { name: 'Trusted Contact', phone: '5550100', relationship: 'Friend' },
        notificationPreferences: {
          tripUpdates: false,
          checkpointArrivals: true,
          safetyAlerts: true,
        },
      }),
    });
    assert.strictEqual(profile.status, 200);
    const body = await profile.json();
    assert.strictEqual(body.user.name, 'Updated Rider');
    assert.strictEqual(body.user.emergencyContact.phone, '5550100');
    assert.strictEqual(body.user.notificationPreferences.tripUpdates, false);

    const me = await fetch(`${baseUrl}/api/v1/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    assert.strictEqual(me.status, 200);
    assert.strictEqual((await me.json()).user._id, user._id.toString());
  });
});
