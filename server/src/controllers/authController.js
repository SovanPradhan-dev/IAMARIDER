import {
  register, login, getMe, refreshTokens, updateProfile, getUserTrips,
} from '../services/authService.js';
import { logger } from '../config/logger.js';

export const registerHandler = async (req, res) => {
  const { name, email, password } = req.validatedBody;
  const user = await register({ name, email, password });
  res.status(201).json({ user });
};

export const loginHandler = async (req, res) => {
  const { email, password } = req.validatedBody;
  const { user, accessToken, refreshToken } = await login({ email, password });

  // Set refresh token in HttpOnly cookie; access token returned in body (short-lived)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    path: '/api/v1/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  logger.info('login response issued', { userId: user._id });
  res.json({ user, accessToken });
};

export const refreshHandler = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  const { user, accessToken, refreshToken: newRefreshToken } = await refreshTokens(refreshToken);

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    path: '/api/v1/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ user, accessToken });
};

export const logoutHandler = async (req, res) => {
  res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh', httpOnly: true, sameSite: 'lax' });
  res.json({ message: 'Logged out' });
};

export const meHandler = async (req, res) => {
  const user = await getMe(req.user.userId);
  res.json({ user });
};

export const updateProfileHandler = async (req, res) => {
  const user = await updateProfile(req.user.userId, req.validatedBody);
  res.json({ user });
};

export const myTripsHandler = async (req, res) => {
  const { page = 1, limit = 20 } = req.validatedQuery || {};
  const result = await getUserTrips(req.user.userId, { page, limit });
  res.json(result);
};
