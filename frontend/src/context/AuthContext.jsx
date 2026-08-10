import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('quickbite_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('quickbite_token') || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && !user) {
      fetchMe();
    }
  }, [token]);

  const fetchMe = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('quickbite_user', JSON.stringify(res.data.user));
      }
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('quickbite_token', res.data.token);
        localStorage.setItem('quickbite_user', JSON.stringify(res.data.user));
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Check credentials.'
      };
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (role) => {
    const demoAccounts = {
      CUSTOMER: 'customer@quickbite.com',
      RESTAURANT_OWNER: 'owner@quickbite.com',
      DELIVERY_PARTNER: 'delivery@quickbite.com',
      ADMIN: 'admin@quickbite.com'
    };

    const email = demoAccounts[role];
    if (email) {
      return await login(email, 'password123');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('quickbite_token');
    localStorage.removeItem('quickbite_user');
    disconnectSocket();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
