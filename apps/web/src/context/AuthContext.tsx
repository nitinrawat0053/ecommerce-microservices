import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../api/client';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, phone: string) => Promise<{ message: string; otpSent?: boolean }>;
  verifyPhone: (phone: string, code: string) => Promise<void>;
  resendOtp: (phone: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string }>;
  verifyResetOtp: (email: string, otp: string) => Promise<{ token: string }>;
  resetPassword: (token: string, newPassword: string, confirmPassword: string) => Promise<{ message: string }>;
  resendResetOtp: (email: string) => Promise<{ message: string }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('accessToken'));

  useEffect(() => {
    if (token) localStorage.setItem('accessToken', token);
    else localStorage.removeItem('accessToken');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: accessToken, user: userData } = res.data.data;
    const u = { ...userData, _id: userData._id || userData.id };
    setToken(accessToken);
    setUser(u);
    return u;
  };

  const register = async (name: string, email: string, password: string, phone: string) => {
    const res = await api.post('/auth/register', { name, email, password, phone });
    return res.data;
  };

  const verifyPhone = async (phone: string, code: string) => {
    const res = await api.post('/auth/verify-phone', { phone, code });
    return res.data;
  };

  const resendOtp = async (phone: string) => {
    const res = await api.post('/auth/resend-otp', { phone });
    return res.data;
  };

  const forgotPassword = async (email: string) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  };

  const verifyResetOtp = async (email: string, otp: string) => {
    const res = await api.post('/auth/verify-reset-otp', { email, otp });
    return res.data.data;
  };

  const resetPassword = async (token: string, newPassword: string, confirmPassword: string) => {
    const res = await api.post('/auth/reset-password', { token, newPassword, confirmPassword });
    return res.data;
  };

  const resendResetOtp = async (email: string) => {
    const res = await api.post('/auth/resend-reset-otp', { email });
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : prev);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      register,
      verifyPhone,
      resendOtp,
      forgotPassword,
      verifyResetOtp,
      resetPassword,
      resendResetOtp,
      logout,
      updateUser,
      isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
      isSuperAdmin: user?.role === 'SUPER_ADMIN',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
