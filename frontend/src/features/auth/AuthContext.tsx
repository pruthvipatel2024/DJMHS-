import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../../services/api';
import { User, StudentProfile } from '../../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeSibling: StudentProfile | null;
  login: (token: string, user: User, rememberMe: boolean) => void;
  logout: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
  switchSibling: (grNumber: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeSibling, setActiveSibling] = useState<StudentProfile | null>(null);

  useEffect(() => {
    // Initialize session from storage on mount
    const savedToken = localStorage.getItem('sdjm_token') || sessionStorage.getItem('sdjm_token');
    const savedUserStr = localStorage.getItem('sdjm_user') || sessionStorage.getItem('sdjm_user');

    if (savedToken && savedUserStr) {
      try {
        const parsedUser = JSON.parse(savedUserStr) as User;
        setToken(savedToken);
        setUser(parsedUser);

        // Initialize active sibling for Parent roles
        if (parsedUser.role.name === 'PARENT' && parsedUser.parentProfile?.students?.length) {
          const firstChild = parsedUser.parentProfile.students[0].student;
          setActiveSibling(firstChild);
        } else if (parsedUser.role.name === 'STUDENT' && parsedUser.studentProfile) {
          setActiveSibling(parsedUser.studentProfile);
        }
      } catch (err) {
        console.error('Error parsing stored session:', err);
        localStorage.clear();
        sessionStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, loggedInUser: User, rememberMe: boolean) => {
    setToken(newToken);
    setUser(loggedInUser);

    const targetStorage = rememberMe ? localStorage : sessionStorage;
    targetStorage.setItem('sdjm_token', newToken);
    targetStorage.setItem('sdjm_user', JSON.stringify(loggedInUser));

    if (loggedInUser.role.name === 'PARENT' && loggedInUser.parentProfile?.students?.length) {
      setActiveSibling(loggedInUser.parentProfile.students[0].student);
    } else if (loggedInUser.role.name === 'STUDENT' && loggedInUser.studentProfile) {
      setActiveSibling(loggedInUser.studentProfile);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (err) {
      console.error('Server logout note:', err);
    } finally {
      localStorage.removeItem('sdjm_token');
      localStorage.removeItem('sdjm_user');
      sessionStorage.removeItem('sdjm_token');
      sessionStorage.removeItem('sdjm_user');
      setToken(null);
      setUser(null);
      setActiveSibling(null);
      window.location.href = '/login';
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    const hasLocal = localStorage.getItem('sdjm_user');
    if (hasLocal) {
      localStorage.setItem('sdjm_user', JSON.stringify(updatedUser));
    } else {
      sessionStorage.setItem('sdjm_user', JSON.stringify(updatedUser));
    }
  };

  const switchSibling = (grNumber: string) => {
    if (user?.parentProfile?.students) {
      const match = user.parentProfile.students.find(s => s.student.grNumber === grNumber);
      if (match) {
        setActiveSibling(match.student);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, activeSibling, login, logout, updateUser, switchSibling }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be utilized within an active AuthProvider wrapper.');
  }
  return context;
};
