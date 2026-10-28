import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, registerUser } from './helpers.js';

let baseUrl;

describe('mini', async () => {
  before(async () => {
    const s = await startTestServer();
    baseUrl = s.baseUrl;
  });
  after(async () => {
    await stopTestServer();
  });

  it('one register', async () => {
    const { res } = await registerUser(baseUrl);
    assert.strictEqual(res.status, 201);
  });
});
