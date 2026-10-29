import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as IOServer } from 'socket.io';
import { User } from '../src/models/User.js';
import { Trip } from '../src/models/Trip.js';
import { TripMember } from '../src/models/TripMember.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

let mongod;
let httpServer;
let ioServerInstance;

export const startTestServer = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Set env before loading app/config modules so env.js reads the in-memory URI
  process.env.MONGODB_URI = uri;
  process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret';
  process.env.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'test-refresh-secret';
  process.env.NODE_ENV = process.env.NODE_ENV || 'test';
  process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

  const { createApp } = await import('../src/app.js');
  const { initSocket } = await import('../src/socket/index.js');

  const app = createApp();
  httpServer = createServer(app);
  ioServerInstance = new IOServer(httpServer, {
    cors: { origin: '*', credentials: true },
    transports: ['websocket', 'polling'],
  });
  initSocket(ioServerInstance);

  await mongoose.connect(uri);

  await new Promise((resolve) => httpServer.listen(0, resolve));
  const port = httpServer.address().port;
  return {
    app,
    httpServer,
    io: ioServerInstance,
    port,
    baseUrl: `http://127.0.0.1:${port}`,
  };
};

const withTimeout = (promise, ms) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

export const stopTestServer = async () => {
  // Graceful shutdown in a safe order to avoid libuv handle errors.
  // We intentionally do NOT call process.exit(): node --test runs each file
  // in a worker of the same process, and process.exit would kill the whole
  // runner. Stopping mongod + mongoose lets the event loop drain naturally.
  try { ioServerInstance.close?.(); } catch (_) {}
  try { httpServer.close?.(); } catch (_) {}
  try { httpServer.closeAllConnections?.(); } catch (_) {}
  try { await withTimeout(mongod.stop(), 8000); } catch (_) {}
  try { await withTimeout(mongoose.disconnect(), 8000); } catch (_) {}
};

export const registerUser = async (baseUrl, overrides = {}) => {
  const payload = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'TestPass123!',
    ...overrides,
  };
  const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { res, payload };
};

export const loginUser = async (baseUrl, email, password) => {
  const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  return { res, accessToken: body.accessToken, user: body.user };
};

export const createUserAndToken = async (overrides = {}) => {
  const { env } = await import('../src/config/env.js');
  const password = 'TestPass123!';
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: overrides.name || 'Socket User',
    email: overrides.email || `socket${Date.now()}@example.com`,
    passwordHash,
  });
  const accessToken = jwt.sign({ userId: user._id, email: user.email }, env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });
  return { user, accessToken, password };
};

export const createTestTrip = async (memberEmails = []) => {
  const leader = await User.create({
    name: 'Trip Leader',
    email: `leader${Date.now()}@example.com`,
    passwordHash: await bcrypt.hash('Pass123!', 10),
  });
  const trip = await Trip.create({
    tripCode: `RT-TEST${Date.now()}`,
    name: 'Test Trip',
    createdBy: leader._id,
    leaderId: leader._id,
    startLocation: { type: 'Point', coordinates: [88.3639, 22.5726] },
    destination: { type: 'Point', coordinates: [87.5115, 22.2503] },
    status: 'scheduled',
    maxMembers: 10,
    privacy: 'private',
  });
  await TripMember.create({
    tripId: trip._id,
    userId: leader._id,
    role: 'leader',
    status: 'joined',
  });
  for (const email of memberEmails) {
    let u = await User.findOne({ email });
    if (!u) {
      u = await User.create({
        name: 'Member',
        email,
        passwordHash: await bcrypt.hash('Pass123!', 10),
      });
    }
    await TripMember.create({ tripId: trip._id, userId: u._id, role: 'rider', status: 'joined' });
  }
  return { trip, leader };
};
