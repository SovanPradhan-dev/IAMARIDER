/**
 * Minimal in-memory auth state store (plain JS observable).
 * Access token is held in memory only — never in localStorage — per security requirements.
 * Refresh token lives in an HttpOnly cookie managed by the backend.
 */
const createAuthStore = () => {
  let state = {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    loading: true,
  };
  const listeners = new Set();

  const notify = () => listeners.forEach((fn) => fn(state));

  return {
    subscribe: (fn) => {
      listeners.add(fn);
      fn(state);
      return () => listeners.delete(fn);
    },
    setTokenAndUser: (accessToken, user) => {
      state = { ...state, user, accessToken, isAuthenticated: true, loading: false };
      notify();
    },
    setLoading: (loading) => {
      state = { ...state, loading };
      notify();
    },
    clear: () => {
      state = { user: null, accessToken: null, isAuthenticated: false, loading: false };
      notify();
    },
    setUser: (user) => {
      state = { ...state, user };
      notify();
    },
    getState: () => state,
  };
};

export const authStore = createAuthStore();
