'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

// ── Demo account definitions ─────────────────────────────────────────────────
const DEMO_USER = {
  id:           'demo-user-001',
  email:        'demo@compliance.ai',
  name:         'Dr. Prachi',
  organization: 'PharmaCorp International',
  role:         'Senior Regulatory Affairs Specialist',
  joined:       '2023-03-15',
  avatar:       'P',
  isDemo:       true,
};

const ADMIN_USER = {
  id:           'admin-user-001',
  email:        'admin@compliance.ai',
  name:         'Admin User',
  organization: 'RegCompCopilot',
  role:         'Admin',
  joined:       '2024-01-01',
  avatar:       'AU',
  isDemo:       false,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user_data');
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // ── Demo bypass (no API call) ──────────────────────────────────────────
      if (email === 'demo@compliance.ai' && password === 'demo123') {
        localStorage.setItem('access_token', 'demo-token');
        localStorage.setItem('user_data', JSON.stringify(DEMO_USER));
        setUser(DEMO_USER);
        router.push('/dashboard');
        toast.success('Welcome back, Dr. Mitchell!');
        return;
      }

      // ── Admin bypass (with API call) ───────────────────────────────────────
      if (email === 'admin@compliance.ai' && password === 'admin123') {
        try {
          const res = await authAPI.login(email, password);
          const token = res.data.access_token;
          const adminUser = {
            ...ADMIN_USER,
            id: res.data.user_id || ADMIN_USER.id,
            name: res.data.full_name || ADMIN_USER.name,
            organization: res.data.organization || ADMIN_USER.organization,
            role: res.data.role || ADMIN_USER.role,
          };
          localStorage.setItem('access_token', token);
          localStorage.setItem('user_data', JSON.stringify(adminUser));
          setUser(adminUser);
          router.push('/dashboard');
          toast.success('Welcome, Admin!');
          return;
        } catch (error) {
          console.error('Admin login error:', error);
          // Backend unreachable — use client-side fallback
          const token = btoa(JSON.stringify({ user_id: ADMIN_USER.id, email, role: 'admin' }));
          localStorage.setItem('access_token', token);
          localStorage.setItem('user_data', JSON.stringify(ADMIN_USER));
          setUser(ADMIN_USER);
          router.push('/dashboard');
          toast.success('Welcome, Admin! (offline mode)');
          return;
        }
      }

      // ── Real API login ─────────────────────────────────────────────────────
      console.log('Attempting login for:', email);
      const res = await authAPI.login(email, password);
      console.log('Login response:', res.data);
      
      const token = res.data.access_token;
      const userData = {
        id: res.data.user_id,
        email: res.data.email || email,
        name: res.data.full_name || email.split('@')[0],
        organization: res.data.organization || 'Organization',
        role: res.data.role || 'Viewer',
        avatar: (res.data.full_name || email)[0].toUpperCase(),
        isDemo: false,
      };

      localStorage.setItem('access_token', token);
      localStorage.setItem('user_data', JSON.stringify(userData));
      setUser(userData);
      
      toast.success(`Welcome back, ${userData.name}!`);
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.message || 
                          'Login failed. Please check your credentials.';
      throw new Error(errorMessage);
    }
  };

  const register = async (email, password, fullName, organization) => {
    try {
      console.log('Attempting registration for:', email);
      const res = await authAPI.register({
        email,
        password,
        full_name: fullName,
        organization,
      });
      console.log('Registration response:', res.data);
      
      toast.success('Registration successful! Please login.');
      return res.data;
      
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.message || 
                          'Registration failed. Please try again.';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    setUser(null);
    router.push('/login');
    toast.success('Signed out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
