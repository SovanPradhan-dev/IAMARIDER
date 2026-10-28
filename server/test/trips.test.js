import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { startTestServer, stopTestServer, registerUser, loginUser, createUserAndToken, createTestTrip } from './helpers.js';

let baseUrl;

describe('Trips', async () => {
  before(async () => {
    const s = await startTestServer();
    baseUrl = s.baseUrl;
  });
  after(async () => {
    await stopTestServer();
  });

  let accessToken;
  let userId;

  beforeEach(async () => {
    const { user, accessToken: token } = await createUserAndToken();
    accessToken = token;
    userId = user._id;
  });

  const authHeaders = () => ({ Authorization: `Bearer ${accessToken}` });

  it('creates a trip and returns a unique trip code', async () => {
    const res = await fetch(`${baseUrl}/api/v1/trips`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kolkata to Digha',
        startLatitude: 22.5726,
        startLongitude: 88.3639,
        destLatitude: 22.2503,
        destLongitude: 87.5115,
        plannedDepartureAt: new Date(Date.now() + 86400000).toISOString(),
        maxMembers: 5,
        privacy: 'private',
      }),
    });
    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.ok(body.trip);
    assert.ok(body.trip.tripCode);
    assert.match(body.trip.tripCode, /^RT-/);
    assert.strictEqual(body.trip.status, 'scheduled');
  });

  it('rejects trip creation with missing auth', async () => {
    const res = await fetch(`${baseUrl}/api/v1/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'No Auth' }),
    });
    assert.strictEqual(res.status, 401);
  });

  it('lists the current user trips', async () => {
    await fetch(`${baseUrl}/api/v1/trips`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'List Trip',
        startLatitude: 22.5726,
        startLongitude: 88.3639,
        destLatitude: 22.2503,
        destLongitude: 87.5115,
      }),
    });
    const res = await fetch(`${baseUrl}/api/v1/trips`, { headers: authHeaders() });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.trips));
    assert.ok(body.trips.length >= 1);
  });

  it('joins a trip by trip code', async () => {
    const { trip } = await createTestTrip();
    // Create a second user to join
    const { user, accessToken: token2 } = await createUserAndToken({ name: 'Joiner' });
    const res = await fetch(`${baseUrl}/api/v1/trips/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token2}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripCode: trip.tripCode }),
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.trip.tripCode, trip.tripCode);
  });

  it('rejects invalid trip code', async () => {
    const res = await fetch(`${baseUrl}/api/v1/trips/join`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripCode: 'INVALID' }),
    });
    assert.strictEqual(res.status, 404);
  });

  it('rejects duplicate join', async () => {
    const { trip } = await createTestTrip();
    // The leader of createTestTrip is a different user; join as current user
    const res = await fetch(`${baseUrl}/api/v1/trips/join`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripCode: trip.tripCode }),
    });
    assert.strictEqual(res.status, 200);
    const res2 = await fetch(`${baseUrl}/api/v1/trips/join`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripCode: trip.tripCode }),
    });
    assert.strictEqual(res2.status, 409);
  });

  it('gets trip details for a member', async () => {
    const { trip } = await createTestTrip();
    // join current user
    await fetch(`${baseUrl}/api/v1/trips/join`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripCode: trip.tripCode }),
    });
    const res = await fetch(`${baseUrl}/api/v1/trips/${trip._id}`, { headers: authHeaders() });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.trip._id, trip._id.toString());
  });

  it('rejects trip details for non-member on private trip', async () => {
    const { trip } = await createTestTrip();
    const res = await fetch(`${baseUrl}/api/v1/trips/${trip._id}`, { headers: authHeaders() });
    assert.strictEqual(res.status, 403);
  });

  it('only leader can start a trip', async () => {
    const { trip, leader } = await createTestTrip();
    const leaderToken = jwtSign(leader._id, leader.email);
    // non-leader tries to start
    const res = await fetch(`${baseUrl}/api/v1/trips/${trip._id}/start`, {
      method: 'POST',
      headers: authHeaders(),
    });
    assert.strictEqual(res.status, 403);

    // leader starts
    const res2 = await fetch(`${baseUrl}/api/v1/trips/${trip._id}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${leaderToken}`, 'Content-Type': 'application/json' },
    });
    assert.strictEqual(res2.status, 200);
  });

  it('only leader can end an active trip', async () => {
    const { trip, leader } = await createTestTrip();
    const leaderToken = jwtSign(leader._id, leader.email);
    await fetch(`${baseUrl}/api/v1/trips/${trip._id}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${leaderToken}`, 'Content-Type': 'application/json' },
    });
    const res = await fetch(`${baseUrl}/api/v1/trips/${trip._id}/end`, {
      method: 'POST',
      headers: authHeaders(),
    });
    assert.strictEqual(res.status, 403);
    const res2 = await fetch(`${baseUrl}/api/v1/trips/${trip._id}/end`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${leaderToken}`, 'Content-Type': 'application/json' },
    });
    assert.strictEqual(res2.status, 200);
  });

  it('prevents exceeding member limit', async () => {
    const { trip, leader } = await createTestTrip([]);
    // set maxMembers to 2 (leader + 1)
    await fetch(`${baseUrl}/api/v1/trips/${trip._id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${jwtSign(leader._id, leader.email)}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ maxMembers: 2 }),
    });
    // first joiner succeeds
    const { user: u1, accessToken: t1 } = await createUserAndToken({ name: 'U1' });
    const r1 = await fetch(`${baseUrl}/api/v1/trips/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${t1}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripCode: trip.tripCode }),
    });
    assert.strictEqual(r1.status, 200);
    // second joiner hits limit
    const { user: u2, accessToken: t2 } = await createUserAndToken({ name: 'U2' });
    const r2 = await fetch(`${baseUrl}/api/v1/trips/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${t2}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripCode: trip.tripCode }),
    });
    assert.strictEqual(r2.status, 403);
  });
});

function jwtSign(userId, email) {
  return jwt.sign({ userId, email }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}
