// Centralized API and Socket configuration linked to deployed backend
export const BACKEND_BASE_URL = 'https://medicine-w6p8.vercel.app';

export const API_URL = import.meta.env.VITE_API_URL || `${BACKEND_BASE_URL}/api`;

export const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (API_URL.startsWith('http')) {
    try {
      return new URL(API_URL).origin;
    } catch {
      return BACKEND_BASE_URL;
    }
  }
  return BACKEND_BASE_URL;
};

export const SOCKET_URL = getSocketUrl();
