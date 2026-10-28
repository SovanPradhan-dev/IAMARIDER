import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { io as Client } from 'socket.io-client';
import { startTestServer, stopTestServer, createUserAndToken, createTestTrip } from './helpers.js';
import { LiveLocation } from '../src/models/LiveLocation.js';

let ioServer;
let port;

describe('Socket.IO real-time tracking', async () => {
  before(async () => {
    const s = await startTestServer();
    ioServer = s.io;
    port = s.port;
  });
  after(async () => {
    await stopTestServer();
  });

  const connectClient = (token) => {
    return new Promise((resolve, reject) => {
      const socket = Client(`http://127.0.0.1:${port}`, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });
      socket.on('connect', () => resolve(socket));
      socket.on('connect_error', (err) => reject(new Error(err.message)));
    });
  };

  const emitAck = (socket, event, data) =>
    new Promise((resolve, reject) => {
      socket.emit(event, data, (resp) => {
        if (resp && resp.error) reject(new Error(resp.error));
        else resolve(resp);
      });
      setTimeout(() => reject(new Error(`timeout waiting for ${event} ack`)), 5000);
    });

  it('authorized members join a trip room and receive member-joined event', async () => {
    const { user: u1, accessToken: t1 } = await createUserAndToken({ name: 'Rider One' });
    const { user: u2, accessToken: t2 } = await createUserAndToken({ name: 'Rider Two' });
    const { trip } = await createTestTrip([u1.email, u2.email]);

    const s1 = await connectClient(t1);
    const s2 = await connectClient(t2);

    const memberJoined = new Promise((resolve) => {
      s1.on('trip:member:joined', (data) => resolve(data));
    });

    await emitAck(s2, 'trip:join', { tripId: trip._id.toString() });

    const data = await memberJoined;
    assert.strictEqual(data.userId, u2._id.toString());
    assert.strictEqual(data.tripId, trip._id.toString());

    s1.disconnect();
    s2.disconnect();
  });

  it('a location update reaches other authorized riders in the same trip', async () => {
    const { user: u1, accessToken: t1 } = await createUserAndToken({ name: 'Rider One' });
    const { user: u2, accessToken: t2 } = await createUserAndToken({ name: 'Rider Two' });
    const { trip } = await createTestTrip([u1.email, u2.email]);

    const s1 = await connectClient(t1);
    const s2 = await connectClient(t2);

    await emitAck(s1, 'trip:join', { tripId: trip._id.toString() });
    await emitAck(s2, 'trip:join', { tripId: trip._id.toString() });

    const locationReceived = new Promise((resolve) => {
      s1.on('location:changed', (data) => resolve(data));
    });

    await emitAck(s2, 'location:update', {
      tripId: trip._id.toString(),
      latitude: 22.5726,
      longitude: 88.3639,
      accuracyMeters: 5,
      speedMps: 10,
      headingDegrees: 90,
    });

    const data = await locationReceived;
    assert.strictEqual(data.userId, u2._id.toString());
    assert.ok(data.location);
    assert.strictEqual(data.location.type, 'Point');
    assert.ok(data.freshness);

    s1.disconnect();
    s2.disconnect();
  });

  it('an unauthenticated socket cannot connect', async () => {
    let connected = false;
    let errMsg = null;
    const socket = Client(`http://127.0.0.1:${port}`, {
      auth: { token: 'invalid-token' },
      transports: ['websocket', 'polling'],
    });
    socket.on('connect', () => { connected = true; });
    socket.on('connect_error', (err) => { errMsg = err.message; socket.disconnect(); });
    await new Promise((r) => setTimeout(r, 1000));
    assert.strictEqual(connected, false);
    assert.ok(errMsg);
  });

  it('reconnecting client recovers current location snapshot', async () => {
    const { user: u1, accessToken: t1 } = await createUserAndToken({ name: 'Recon Rider' });
    const { trip } = await createTestTrip([u1.email]);

    const s1 = await connectClient(t1);
    await emitAck(s1, 'trip:join', { tripId: trip._id.toString() });

    // Post a location via REST so it exists before reconnect
    await fetch(`http://127.0.0.1:${port}/api/v1/trips/${trip._id}/locations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${t1}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: 22.5726, longitude: 88.3639, accuracyMeters: 4 }),
    });

    s1.disconnect();
    await new Promise((r) => setTimeout(r, 300));

    const s2 = await connectClient(t1);
    const snapshot = await emitAck(s2, 'trip:join', { tripId: trip._id.toString() });
    assert.ok(snapshot.locations);
    assert.ok(snapshot.locations.some((l) => l.userId === u1._id.toString()));

    s2.disconnect();
  });

  it('completed trips reject new location updates', async () => {
    const { user: u1, accessToken: t1 } = await createUserAndToken({ name: 'Completed Rider' });
    const { trip, leader } = await createTestTrip([u1.email]);
    const leaderToken = (await createUserAndToken({ email: leader.email })).accessToken;

    // End the trip as leader
    await fetch(`http://127.0.0.1:${port}/api/v1/trips/${trip._id}/end`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${leaderToken}`, 'Content-Type': 'application/json' },
    });

    const s1 = await connectClient(t1);
    try {
      await emitAck(s1, 'location:update', {
        tripId: trip._id.toString(),
        latitude: 22.5726,
        longitude: 88.3639,
      });
      assert.fail('should have rejected location update on completed trip');
    } catch (err) {
      assert.ok(err.message.includes('not active') || err.message.includes('400'));
    }
    s1.disconnect();
  });
});
