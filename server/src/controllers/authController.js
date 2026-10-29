import {
  register, login, getMe, refreshTokens, revokeRefreshToken, updateProfile, getUserTrips,
  changePassword,
} from '../services/authService.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'lax',
  path: '/api/v1/auth',
  maxAge: env.REFRESH_TOKEN_TTL_MS,
};

export const registerHandler = async (req, res) => {
  const { name, email, password } = req.validatedBody;
  const user = await register({ name, email, password });
  res.status(201).json({ user });
};

export const loginHandler = async (req, res) => {
  const { email, password } = req.validatedBody;
  const { user, accessToken, refreshToken } = await login({ email, password });

  // Set refresh token in HttpOnly cookie; access token returned in body (short-lived)
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);

  logger.info('login response issued', { userId: user._id });
  res.json({ user, accessToken });
};

export const refreshHandler = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  const { user, accessToken, refreshToken: newRefreshToken } = await refreshTokens(refreshToken);

  res.cookie('refreshToken', newRefreshToken, refreshCookieOptions);

  res.json({ user, accessToken });
};

export const logoutHandler = async (req, res) => {
  await revokeRefreshToken(req.cookies.refreshToken);
  res.clearCookie('refreshToken', refreshCookieOptions);
  res.json({ message: 'Logged out' });
};

export const changePasswordHandler = async (req, res) => {
  const refreshToken = await changePassword(req.user.userId, req.validatedBody);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
  res.json({ message: 'Password updated' });
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
