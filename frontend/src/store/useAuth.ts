import { create } from 'zustand';
import { api, ApiError, storeAuthToken, getStoredToken } from '../api/client';
import type { DoctorUser } from '../api/client';

interface AuthState {
  user: DoctorUser | null;
  token: string | null;
  loading: boolean;
  error: string;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  restore: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: getStoredToken(),
  loading: true,
  error: '',

  login: async (username, password) => {
    set({ loading: true, error: '' });
    try {
      const result = await api.login({ username, password });
      storeAuthToken(result.token);
      set({ user: result.user, token: result.token, loading: false });
      return true;
    } catch (e) {
      set({
        loading: false,
        error: e instanceof ApiError ? e.message : 'Something went wrong.',
      });
      return false;
    }
  },

  logout: () => {
    storeAuthToken(null);
    set({ user: null, token: null });
  },

  restore: async () => {
    const token = getStoredToken();
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      const me = await api.getMe();
      set({ user: me, token, loading: false });
    } catch {
      storeAuthToken(null);
      set({ user: null, token: null, loading: false });
    }
  },
}));
