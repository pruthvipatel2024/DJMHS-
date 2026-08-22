import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

interface ThemeContextType {
  theme: any;
  setTheme: (theme: any) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch SchoolProfile on mount
    const fetchTheme = async () => {
      try {
        const res = await api.get('/settings/school-profile');
        if (res.data && res.data.data) {
          setTheme(res.data.data);
          applyThemeVariables(res.data.data);
        }
      } catch (error) {
        console.error('Failed to load school profile theme:', error);
        // Fallback theme colors
        applyThemeVariables({
          primaryColor: '#123E97',
          secondaryColor: '#0B2D78',
          accentColor: '#F2B233',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchTheme();
  }, []);

  const applyThemeVariables = (t: any) => {
    const root = document.documentElement;
    // We can compute lighter/darker shades here for the 50-900 scale
    // For simplicity, we just set the main ones that Tailwind config expects
    if (t.primaryColor) {
      root.style.setProperty('--color-primary-600', t.primaryColor);
    }
    if (t.secondaryColor) {
      root.style.setProperty('--color-primary-700', t.secondaryColor);
    }
    if (t.accentColor) {
      root.style.setProperty('--color-accent-500', t.accentColor);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};
