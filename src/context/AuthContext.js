import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // malformed token — treat as expired
  }
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('vistaar_token');
    const u = localStorage.getItem('vistaar_user');
    if (t && u && !isTokenExpired(t)) {
      setToken(t);
      setUser(JSON.parse(u));
    } else if (t || u) {
      localStorage.removeItem('vistaar_token');
      localStorage.removeItem('vistaar_user');
    }
    setLoading(false);
  }, []);

  function login(token, user) {
    localStorage.setItem('vistaar_token', token);
    localStorage.setItem('vistaar_user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  }

  const logout = useCallback(() => {
    localStorage.removeItem('vistaar_token');
    localStorage.removeItem('vistaar_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
