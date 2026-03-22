import React, { createContext, useContext, useState } from 'react';

export type Role = 'owner' | 'member' | 'trainer';

export interface User {
  name: string;
  email: string;
  role: Role | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  selectRole: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, _password: string) => {
    // Simulate API call — replace with real auth later
    setUser({ name: email.split('@')[0], email, role: null });
  };

  const signup = async (name: string, email: string, _password: string) => {
    // Simulate API call — replace with real auth later
    setUser({ name, email, role: null });
  };

  const selectRole = (role: Role) => {
    setUser(prev => prev ? { ...prev, role } : null);
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, signup, selectRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
