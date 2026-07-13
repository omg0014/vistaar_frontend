import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export default function useAuthFetch() {
  const { token } = useAuth();
  return useCallback((url, options = {}) =>
    fetch(url, {
      ...options,
      headers: { ...options.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    }), [token]);
}
