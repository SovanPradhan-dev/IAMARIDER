import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../config/logger.js';

const SALT_ROUNDS = 12;

export const hashPassword = async (password) => bcrypt.hash(password, SALT_ROUNDS);

export const comparePassword = async (plain, hash) => bcrypt.compare(plain, hash);

export const generateAccessToken = (userId, email) =>
  jwt.sign({ userId, email }, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL });

export const generateRefreshToken = (userId) =>
  jwt.sign({ userId }, env.REFRESH_TOKEN_SECRET, { expiresIn: env.REFRESH_TOKEN_TTL });

/**
 * Register a new user. Throws AppError(409) if email already exists.
 */
export const register = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({ name, email, passwordHash });

  logger.info('user registered', { userId: user._id, email });
  return user.toSafeObject();
};

/**
 * Authenticate user and return access token + refresh token cookie payload.
 */
export const login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const accessToken = generateAccessToken(user._id, user.email);
  const refreshToken = generateRefreshToken(user._id);

  logger.info('user logged in', { userId: user._id, email });
  return {
    user: user.toSafeObject(),
    accessToken,
    refreshToken,
  };
};

export const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return user.toSafeObject();
};

export const refreshTokens = async (refreshToken) => {
  if (!refreshToken) throw new AppError('Refresh token required', 401);

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Refresh token expired, please log in again', 401);
    }
    throw new AppError('Invalid refresh token', 401);
  }

  const user = await User.findById(decoded.userId);
  if (!user) throw new AppError('User not found', 401);

  const accessToken = generateAccessToken(user._id, user.email);
  const newRefreshToken = generateRefreshToken(user._id);

  logger.info('tokens refreshed', { userId: user._id });
  return { user: user.toSafeObject(), accessToken, refreshToken: newRefreshToken };
};

export const updateProfile = async (userId, data) => {
  const allowed = ['name', 'avatarUrl', 'emergencyContact'];
  const updates = {};
  for (const key of allowed) {
    if (data[key] !== undefined) updates[key] = data[key];
  }

  const user = await User.findByIdAndUpdate(userId, { $set: updates }, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new AppError('User not found', 404);

  return user.toSafeObject();
};

export const getUserTrips = async (userId, { page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;

  // Find memberships for this user
  const memberships = await (
    await import('../models/TripMember.js')
  ).default.find({ userId, status: 'joined' })
    .populate('tripId')
    .sort({ joinedAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await (
    await import('../models/TripMember.js')
  ).default.countDocuments({ userId, status: 'joined' });

  return {
    trips: memberships.map((m) => m.tripId),
    total,
    page,
    limit,
  };
};
