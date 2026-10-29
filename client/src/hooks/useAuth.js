import { useEffect, useState, useCallback } from 'react';
import { authStore } from '../store/authStore';
import { api, setAccessToken } from '../lib/api';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket';

export const useAuth = () => {
  const [state, setState] = useState(authStore.getState());

  useEffect(() => {
    const unsub = authStore.subscribe(setState);
    return unsub;
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user, accessToken } = res.data;
    setAccessToken(accessToken);
    authStore.setTokenAndUser(accessToken, user);
    return { user, accessToken };
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    return res.data;
  }, []);

  const refresh = useCallback(async () => {
    const res = await api.post('/auth/refresh', {});
    const { user, accessToken } = res.data;
    setAccessToken(accessToken);
    authStore.setTokenAndUser(accessToken, user);
    return { user, accessToken };
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {
      // ignore
    }
    setAccessToken(null);
    disconnectSocket();
    authStore.clear();
  }, []);

  const getMe = useCallback(async () => {
    const res = await api.get('/auth/me');
    authStore.setUser(res.data.user);
    return res.data.user;
  }, []);

  return {
    ...state,
    login,
    register,
    refresh,
    logout,
    getMe,
  };
};

export const useSocket = () => {
  const [socket, setSocket] = useState(getSocket());

  useEffect(() => {
    if (!socket) return;
    const unsub = () => {};
    return unsub;
  }, [socket]);

  return socket;
};
