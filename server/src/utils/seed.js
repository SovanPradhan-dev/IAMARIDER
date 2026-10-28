/**
 * Seed script for clearly labeled demo users and trips.
 * Run: npm run seed  (requires MONGODB_URI and JWT secrets in .env)
 * WARNING: This creates test/demo data. Do not run against production.
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Trip } from '../models/Trip.js';
import { TripMember } from '../models/TripMember.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';

const DEMO_PASSWORD = 'DemoPass123!';

const users = [
  { name: 'Alex Rider', email: 'alex.demo@ridetogether.example', role: 'leader' },
  { name: 'Sam Explorer', email: 'sam.demo@ridetogether.example', role: 'rider' },
  { name: 'Jamie Wayfarer', email: 'jamie.demo@ridetogether.example', role: 'rider' },
];

const trips = [
  {
    name: 'Kolkata to Digha Motorcycle Ride',
    description: 'Weekend coastal motorcycle trip. Demo data only.',
    startLatitude: 22.5726,
    startLongitude: 88.3639,
    destLatitude: 22.2503,
    destLongitude: 87.5115,
    plannedDepartureAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    maxMembers: 10,
    privacy: 'private',
  },
];

const run = async () => {
  await connectDB();

  // Clear demo data
  await User.deleteMany({ email: /@ridetogether\.example$/ });
  await Trip.deleteMany({ name: /Demo data only/ });

  const createdUsers = [];
  for (const u of users) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const user = await User.create({
      name: u.name,
      email: u.email,
      passwordHash,
      avatarUrl: undefined,
    });
    createdUsers.push({ ...u, _id: user._id });
    console.log(`Created demo user: ${u.email} / password: ${DEMO_PASSWORD}`);
  }

  const leader = createdUsers.find((u) => u.role === 'leader');
  const tripData = trips[0];
  const trip = await Trip.create({
    ...tripData,
    tripCode: 'RT-DEMO01',
    createdBy: leader._id,
    leaderId: leader._id,
    startLocation: { type: 'Point', coordinates: [tripData.startLongitude, tripData.startLatitude] },
    destination: { type: 'Point', coordinates: [tripData.destLongitude, tripData.destLatitude] },
  });

  for (const u of createdUsers) {
    await TripMember.create({
      tripId: trip._id,
      userId: u._id,
      role: u.role,
      status: 'joined',
    });
  }

  console.log(`Created demo trip: ${trip.name} (code: ${trip.tripCode})`);
  console.log('Demo seed complete.');
  await disconnectDB();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
