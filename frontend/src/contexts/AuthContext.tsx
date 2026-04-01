// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

// ============================================================================
// TYPES
// ============================================================================

interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  avatar?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // -------------------------------------------------------------------------
  // Initialize: Check if user is already logged in
  // -------------------------------------------------------------------------
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          console.log('🔐 Found token, fetching user...');
          const userData = await authApi.getMe();
          setUser(userData);
          console.log('✅ User loaded:', userData.email);
        } catch (error) {
          console.error('❌ Token invalid, clearing...');
          localStorage.removeItem('token');
          setUser(null);
        }
      } else {
        console.log('🔓 No token found');
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // -------------------------------------------------------------------------
  // Login with email/password
  // -------------------------------------------------------------------------
  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log('🔐 Logging in...');
      const response = await authApi.login(email, password);
      
      // Extract and save token
      const token = response.access_token || response.token;
      if (token) {
        localStorage.setItem('token', token);
        console.log('✅ Token saved');
      } else {
        throw new Error('No token received from server');
      }

      // Fetch user data
      const userData = await authApi.getMe();
      setUser(userData);
      console.log('✅ Login successful:', userData.email);
      
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      localStorage.removeItem('token');
      setUser(null);
      
      // Re-throw with a user-friendly message
      const message = error.response?.data?.detail || error.message || 'Login failed';
      throw new Error(message);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Register new account
  // -------------------------------------------------------------------------
  const register = useCallback(async (data: RegisterData) => {
    try {
      console.log('📝 Registering...');
      const response = await authApi.register(data);
      
      // If backend returns token on registration (auto-login)
      const token = response.access_token || response.token;
      if (token) {
        localStorage.setItem('token', token);
        const userData = await authApi.getMe();
        setUser(userData);
        console.log('✅ Registration successful, auto-logged in');
      } else {
        console.log('✅ Registration successful, please login');
      }
      
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      const message = error.response?.data?.detail || error.message || 'Registration failed';
      throw new Error(message);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Google OAuth Login
  // -------------------------------------------------------------------------
  const googleLogin = useCallback(async (credential: string) => {
    try {
      console.log('🔐 Google login...');
      const response = await authApi.googleLogin(credential);
      
      const token = response.access_token || response.token;
      if (token) {
        localStorage.setItem('token', token);
        console.log('✅ Google token saved');
      } else {
        throw new Error('No token received from Google login');
      }

      const userData = await authApi.getMe();
      setUser(userData);
      console.log('✅ Google login successful:', userData.email);
      
    } catch (error: any) {
      console.error('❌ Google login failed:', error);
      localStorage.removeItem('token');
      setUser(null);
      
      const message = error.response?.data?.detail || error.message || 'Google login failed';
      throw new Error(message);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Logout
  // -------------------------------------------------------------------------
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.warn('Logout API call failed, clearing local state anyway');
    }
    
    localStorage.removeItem('token');
    setUser(null);
    console.log('👋 Logged out');
  }, []);

  // -------------------------------------------------------------------------
  // Update user locally (for profile updates)
  // -------------------------------------------------------------------------
  const updateUser = useCallback((data: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
  }, []);

  // -------------------------------------------------------------------------
  // Refresh user data from server
  // -------------------------------------------------------------------------
  const refreshUser = useCallback(async () => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user');
    }
  }, []);

  // -------------------------------------------------------------------------
  // Context Value
  // -------------------------------------------------------------------------
  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    googleLogin,
    logout,
    updateUser,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;