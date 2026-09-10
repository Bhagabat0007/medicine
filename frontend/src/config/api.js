// Centralized API and Socket configuration
export const API_URL = import.meta.env.VITE_API_URL || '/api';

export const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http')) {
    try {
      return new URL(import.meta.env.VITE_API_URL).origin;
    } catch {
      return window.location.origin;
    }
  }
  return window.location.origin;
};

export const SOCKET_URL = getSocketUrl();
