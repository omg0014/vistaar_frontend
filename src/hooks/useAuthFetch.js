import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export default function useAuthFetch() {
  const { token, logout } = useAuth();
  return useCallback(async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: { ...options.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (res.status === 401) logout(); // session expired — PrivateRoute redirects to /login
    return res;
  }, [token, logout]);
}
