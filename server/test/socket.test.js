import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { io as Client } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import { startTestServer, stopTestServer, createUserAndToken, createTestTrip } from './helpers.js';
import { LiveLocation } from '../src/models/LiveLocation.js';

const signLeaderToken = async (leader) => {
  const { env } = await import('../src/config/env.js');
  return jwt.sign({ userId: leader._id, email: leader.email }, env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });
};

let ioServer;
let port;

describe('Socket.IO real-time tracking', async () => {
  before(async () => {
    console.error('DBG before startTestServer');
    const s = await startTestServer();
    ioServer = s.io;
    port = s.port;
    console.error('DBG before done', port);
  });
  after(async () => {
    console.error('DBG after start');
    await stopTestServer();
    console.error('DBG after done');
  });

  const connectClient = (token) => {
    console.error('DBG connectClient start');
    return new Promise((resolve, reject) => {
      const socket = Client(`http://127.0.0.1:${port}`, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });
      socket.on('connect', () => {
        console.error('DBG client connect event');
        resolve(socket);
      });
      socket.on('connect_error', (err) => reject(new Error(err.message)));
    });
  };

  const emitAckRaw = (socket, event, data) =>
    new Promise((resolve, reject) => {
      console.error('DBG emitAck', event);
      socket.emit(event, data, (resp) => {
        console.error('DBG emitAck ack', event, resp);
        resolve(resp);
      });
      setTimeout(() => reject(new Error(`timeout waiting for ${event} ack`)), 5000);
    });

  const emitAck = async (socket, event, data) => {
    const response = await emitAckRaw(socket, event, data);
    if (response?.error) throw new Error(response.error);
    return response;
  };

  it('authorized members join a trip room and receive member-joined event', async () => {
    console.error('DBG test1 start');
    const { user: u1, accessToken: t1 } = await createUserAndToken({ name: 'Rider One' });
    const { user: u2, accessToken: t2 } = await createUserAndToken({ name: 'Rider Two' });
    console.error('DBG test1 users created', u1._id, u2._id);
    const { trip } = await createTestTrip([u1.email, u2.email]);
    console.error('DBG test1 trip created', trip._id, trip.tripCode);

    const s1 = await connectClient(t1);
    const s2 = await connectClient(t2);
    console.error('DBG test1 both connected');

    // s1 joins first so it is in the room when s2 joins
    await emitAck(s1, 'trip:join', { tripId: trip._id.toString() });
    console.error('DBG test1 s1 joined');

    const memberJoined = new Promise((resolve) => {
      s1.on('trip:member:joined', (data) => {
        console.error('DBG test1 memberJoined received', data);
        resolve(data);
      });
    });

    await emitAck(s2, 'trip:join', { tripId: trip._id.toString() });
    console.error('DBG test1 trip:join ack received');

    const data = await memberJoined;
    assert.strictEqual(data.userId, u2._id.toString());
    assert.strictEqual(data.tripId, trip._id.toString());
    console.error('DBG test1 done');

    s1.disconnect();
    s2.disconnect();
  });

  it('a location update reaches other authorized riders in the same trip', async () => {
    const { user: u1, accessToken: t1 } = await createUserAndToken({ name: 'Rider One' });
    const { user: u2, accessToken: t2 } = await createUserAndToken({ name: 'Rider Two' });
    const { trip, leader } = await createTestTrip([u1.email, u2.email]);
    await fetch(`http://127.0.0.1:${port}/api/v1/trips/${trip._id}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${await signLeaderToken(leader)}`, 'Content-Type': 'application/json' },
    });

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

    const secondUpdate = await emitAckRaw(s2, 'location:update', {
      tripId: trip._id.toString(),
      latitude: 22.5727,
      longitude: 88.364,
      accuracyMeters: 5,
      speedMps: null,
      headingDegrees: null,
    });
    assert.strictEqual(secondUpdate.ok, true);

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
    const { trip, leader } = await createTestTrip([u1.email]);
    await fetch(`http://127.0.0.1:${port}/api/v1/trips/${trip._id}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${await signLeaderToken(leader)}`, 'Content-Type': 'application/json' },
    });

    const s1 = await connectClient(t1);
    await emitAck(s1, 'trip:join', { tripId: trip._id.toString() });

    // Post a live location via socket so it persists before reconnect
    await emitAck(s1, 'location:update', {
      tripId: trip._id.toString(),
      latitude: 22.5726,
      longitude: 88.3639,
      accuracyMeters: 4,
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
    const leaderToken = await signLeaderToken(leader);

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
      assert.ok(/active trip/i.test(err.message));
    }
    s1.disconnect();
  });

  it('persists and broadcasts a trip chat message', async () => {
    const { user, accessToken } = await createUserAndToken({ name: 'Chat Rider' });
    const { trip } = await createTestTrip([user.email]);
    const socket = await connectClient(accessToken);
    await emitAck(socket, 'trip:join', { tripId: trip._id.toString() });

    const received = new Promise((resolve) => {
      socket.once('trip:message:new', resolve);
    });
    await emitAck(socket, 'trip:message:send', {
      tripId: trip._id.toString(),
      text: 'Ready to ride',
    });
    const message = await received;
    assert.strictEqual(message.text, 'Ready to ride');
    assert.strictEqual(message.senderId._id.toString(), user._id.toString());
    socket.disconnect();
  });
});
