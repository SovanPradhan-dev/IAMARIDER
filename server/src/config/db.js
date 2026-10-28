import mongoose from 'mongoose';
import { env } from './env.js';

let connection = null;

export const connectDB = async () => {
  if (connection) return connection;
  connection = await mongoose.connect(env.MONGODB_URI, {
    autoIndex: true,
  });
  return connection;
};

export const disconnectDB = async () => {
  if (connection) {
    await mongoose.disconnect();
    connection = null;
  }
};
