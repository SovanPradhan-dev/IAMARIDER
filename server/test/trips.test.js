import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { Notification } from '../src/models/Notification.js';
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

  const createOwnedTrip = async (overrides = {}) => {
    const res = await fetch(`${baseUrl}/api/v1/trips`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Feature Test Trip',
        startLatitude: 22.5726,
        startLongitude: 88.3639,
        destLatitude: 22.2503,
        destLongitude: 87.5115,
        ...overrides,
      }),
    });
    assert.strictEqual(res.status, 201);
    return (await res.json()).trip;
  };

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
    const text = await res.text();
    console.error('DEBUG join status', res.status, 'body', text);
    assert.strictEqual(res.status, 200);
    const body = JSON.parse(text);
    assert.strictEqual(body.trip.tripCode, trip.tripCode);
  });

  it('persists trip notifications and scopes read actions to their owner', async () => {
    const trip = await createOwnedTrip();
    const { accessToken: joinerToken } = await createUserAndToken({ name: 'Joining rider' });
    const joinResponse = await fetch(`${baseUrl}/api/v1/trips/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${joinerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripCode: trip.tripCode }),
    });
    assert.strictEqual(joinResponse.status, 200);

    const listResponse = await fetch(`${baseUrl}/api/v1/users/me/notifications`, {
      headers: authHeaders(),
    });
    assert.strictEqual(listResponse.status, 200);
    const list = await listResponse.json();
    assert.strictEqual(list.unreadCount, 1);
    assert.strictEqual(list.notifications[0].type, 'new_participant');
    assert.strictEqual(list.notifications[0].tripId, trip._id);

    const notificationId = list.notifications[0]._id;
    const outsider = await createUserAndToken();
    const forbiddenRead = await fetch(
      `${baseUrl}/api/v1/users/me/notifications/${notificationId}/read`,
      { method: 'PATCH', headers: { Authorization: `Bearer ${outsider.accessToken}` } }
    );
    assert.strictEqual(forbiddenRead.status, 404);

    const readResponse = await fetch(
      `${baseUrl}/api/v1/users/me/notifications/${notificationId}/read`,
      { method: 'PATCH', headers: authHeaders() }
    );
    assert.strictEqual(readResponse.status, 200);

    await Notification.create({
      userId,
      tripId: trip._id,
      type: 'trip_started',
      title: 'Trip started',
      message: 'Your trip is now active.',
    });
    const markAllResponse = await fetch(
      `${baseUrl}/api/v1/users/me/notifications/read-all`,
      { method: 'PATCH', headers: authHeaders() }
    );
    assert.strictEqual(markAllResponse.status, 200);
    assert.strictEqual((await markAllResponse.json()).modifiedCount, 1);

    const preferenceResponse = await fetch(`${baseUrl}/api/v1/users/me`, {
      method: 'PATCH',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationPreferences: {
          tripUpdates: false,
          checkpointArrivals: true,
          safetyAlerts: true,
        },
      }),
    });
    assert.strictEqual(preferenceResponse.status, 200);

    const { accessToken: nextJoinerToken } = await createUserAndToken();
    const nextJoinResponse = await fetch(`${baseUrl}/api/v1/trips/join`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${nextJoinerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tripCode: trip.tripCode }),
    });
    assert.strictEqual(nextJoinResponse.status, 200);
    const refreshedList = await fetch(`${baseUrl}/api/v1/users/me/notifications`, {
      headers: authHeaders(),
    });
    assert.strictEqual((await refreshedList.json()).total, 2);
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

  it('does not expose trip locations, history, or members to non-members', async () => {
    const { trip } = await createTestTrip();
    const paths = [
      `/locations`,
      `/history`,
      `/members`,
    ];
    for (const path of paths) {
      const res = await fetch(`${baseUrl}/api/v1/trips/${trip._id}${path}`, {
        headers: authHeaders(),
      });
      assert.strictEqual(res.status, 403, `${path} should require trip membership`);
    }
  });

  it('reserves the final trip seat atomically for concurrent joins', async () => {
    const { trip } = await createTestTrip();
    trip.maxMembers = 2;
    await trip.save();
    const riders = await Promise.all([
      createUserAndToken({ name: 'Concurrent Rider One' }),
      createUserAndToken({ name: 'Concurrent Rider Two' }),
    ]);

    const results = await Promise.all(riders.map(({ accessToken: token }) =>
      fetch(`${baseUrl}/api/v1/trips/join`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tripCode: trip.tripCode }),
      })
    ));

    assert.deepStrictEqual(results.map((result) => result.status).sort(), [200, 403]);
    const refreshedTrip = await trip.constructor.findById(trip._id);
    assert.strictEqual(refreshedTrip.memberCount, 2);
  });

  it('creates checkpoints and records each member arrival only once', async () => {
    const trip = await createOwnedTrip();
    const created = await fetch(`${baseUrl}/api/v1/trips/${trip._id}/checkpoints`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Coastal stop',
        latitude: 22.35,
        longitude: 87.72,
        sequence: 1,
      }),
    });
    assert.strictEqual(created.status, 201);
    const checkpoint = (await created.json()).checkpoint;

    const arrivalUrl = `${baseUrl}/api/v1/trips/${trip._id}/checkpoints/${checkpoint._id}/arrivals`;
    const arrival = await fetch(arrivalUrl, { method: 'POST', headers: authHeaders() });
    assert.strictEqual(arrival.status, 201);
    const duplicate = await fetch(arrivalUrl, { method: 'POST', headers: authHeaders() });
    assert.strictEqual(duplicate.status, 409);

    const arrivals = await fetch(arrivalUrl, { headers: authHeaders() });
    assert.strictEqual(arrivals.status, 200);
    assert.strictEqual((await arrivals.json()).arrivals.length, 1);
  });

  it('accepts and stops active-trip location sharing through the REST API', async () => {
    const trip = await createOwnedTrip();
    const started = await fetch(`${baseUrl}/api/v1/trips/${trip._id}/start`, {
      method: 'POST',
      headers: authHeaders(),
    });
    assert.strictEqual(started.status, 200);

    const locationUrl = `${baseUrl}/api/v1/trips/${trip._id}/locations`;
    const update = await fetch(locationUrl, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: 22.5726,
        longitude: 88.3639,
        accuracyMeters: 8,
        speedMps: null,
        headingDegrees: null,
      }),
    });
    assert.strictEqual(update.status, 200);

    const stop = await fetch(locationUrl, { method: 'DELETE', headers: authHeaders() });
    assert.strictEqual(stop.status, 200);
    const snapshot = await fetch(locationUrl, { headers: authHeaders() });
    const { locations } = await snapshot.json();
    assert.strictEqual(locations[0].location, null);
  });

  it('validates checkpoint and emergency identifiers before database queries', async () => {
    const trip = await createOwnedTrip();
    for (const path of [
      `/checkpoints/not-an-id`,
      `/emergencies/not-an-id`,
    ]) {
      const res = await fetch(`${baseUrl}/api/v1/trips/${trip._id}${path}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      });
      assert.strictEqual(res.status, 400, `${path} should fail parameter validation`);
    }
  });
});

function jwtSign(userId, email) {
  return jwt.sign({ userId, email }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}
