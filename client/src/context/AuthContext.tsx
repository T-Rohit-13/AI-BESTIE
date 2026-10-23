import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthToken, setAuthToken } from '../services/api';

interface User {
  id: string;
  username: string;
  fullName: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Demo token initialized for seamless navigation if not logged in
  const [token, setTokenState] = useState<string | null>(() => {
    // In-memory or session-only token for development
    return sessionStorage.getItem('inaro_auth_session') || 'demo_token_inaro_auth';
  });

  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('inaro_user_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return {
      id: 'usr_demo_01',
      username: 'companion_user',
      fullName: 'Companion User',
    };
  });

  useEffect(() => {
    if (token) {
      setAuthToken(token);
    }
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    setAuthToken(newToken);
    setTokenState(newToken);
    setUser(newUser);
    sessionStorage.setItem('inaro_auth_session', newToken);
    sessionStorage.setItem('inaro_user_session', JSON.stringify(newUser));
  };

  const logout = () => {
    setAuthToken(null);
    setTokenState(null);
    setUser(null);
    sessionStorage.removeItem('inaro_auth_session');
    sessionStorage.removeItem('inaro_user_session');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
