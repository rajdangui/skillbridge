import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    authAPI.getMe()
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    setTransitioning(true);
    try {
      const res = await authAPI.login(credentials);
      setUser(res.data.user);
      return res.data.user;
    } finally {
      setTransitioning(false);
    }
  };

  const register = async (data) => {
    setTransitioning(true);
    try {
      const res = await authAPI.register(data);
      setUser(res.data.user);
      return res.data.user;
    } finally {
      setTransitioning(false);
    }
  };

  const logout = async () => {
    setTransitioning(true);
    try {
      await authAPI.logout();
    } catch (err) {
      console.warn('Backend session logout failed, clearing local session:', err.message);
    } finally {
      setUser(null);
      setTransitioning(false);
    }
  };

  const updateUser = (updatedUser) => setUser(prev => ({ ...prev, ...updatedUser }));

  return (
    <AuthContext.Provider value={{ user, loading, transitioning, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

