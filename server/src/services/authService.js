import bcrypt from 'bcryptjs';
import { createHmac, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { RefreshSession } from '../models/RefreshSession.js';
import { TripMember } from '../models/TripMember.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../config/logger.js';

const SALT_ROUNDS = 12;

export const hashPassword = async (password) => bcrypt.hash(password, SALT_ROUNDS);

export const comparePassword = async (plain, hash) => bcrypt.compare(plain, hash);

export const generateAccessToken = (userId, email) =>
  jwt.sign({ userId, email }, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL });

const generateRefreshToken = () => randomBytes(32).toString('base64url');
const hashRefreshToken = (token) => createHmac('sha256', env.REFRESH_TOKEN_SECRET).update(token).digest('hex');

const createRefreshSession = async (userId) => {
  const refreshToken = generateRefreshToken();
  await RefreshSession.create({
    userId,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_MS),
  });
  return refreshToken;
};

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

  logger.info('user registered', { userId: user._id });
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
  const refreshToken = await createRefreshSession(user._id);

  logger.info('user logged in', { userId: user._id });
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

  const session = await RefreshSession.findOneAndDelete({
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: { $gt: new Date() },
  });
  if (!session) throw new AppError('Refresh token is invalid or expired', 401);

  const user = await User.findById(session.userId);
  if (!user) throw new AppError('User not found', 401);

  const accessToken = generateAccessToken(user._id, user.email);
  const newRefreshToken = await createRefreshSession(user._id);

  logger.info('tokens refreshed', { userId: user._id });
  return { user: user.toSafeObject(), accessToken, refreshToken: newRefreshToken };
};

export const revokeRefreshToken = async (refreshToken) => {
  if (!refreshToken) return;
  await RefreshSession.deleteOne({ tokenHash: hashRefreshToken(refreshToken) });
};

export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  if (!(await comparePassword(currentPassword, user.passwordHash))) {
    throw new AppError('Current password is incorrect', 400);
  }
  if (await comparePassword(newPassword, user.passwordHash)) {
    throw new AppError('Choose a password you have not used before', 400);
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  await RefreshSession.deleteMany({ userId: user._id });
  return createRefreshSession(user._id);
};

export const updateProfile = async (userId, data) => {
  const allowed = ['name', 'avatarUrl', 'emergencyContact', 'notificationPreferences'];
  const updates = {};
  for (const key of allowed) {
    if (key !== 'emergencyContact' && data[key] !== undefined) updates[key] = data[key];
  }

  const update = { $set: updates };
  if (data.emergencyContact === null) update.$unset = { emergencyContact: 1 };
  else if (data.emergencyContact !== undefined) update.$set.emergencyContact = data.emergencyContact;

  const user = await User.findByIdAndUpdate(userId, update, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new AppError('User not found', 404);

  return user.toSafeObject();
};

export const getUserTrips = async (userId, { page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;

  // Find memberships for this user, populated with trip details
  const memberships = await TripMember.find({ userId, status: 'joined' })
    .populate({
      path: 'tripId',
      select: 'tripCode name description status startDate endDate createdAt updatedAt leaderId startLocation destination maxMembers privacy',
    })
    .sort({ joinedAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await TripMember.countDocuments({ userId, status: 'joined' });

  return {
    trips: memberships.map((m) => m.tripId),
    total,
    page,
    limit,
  };
};
