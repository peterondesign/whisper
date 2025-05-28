'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme, lightTheme, darkTheme } from '@/types/theme';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
    } else {
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      // Update CSS variables
      const root = document.documentElement;
      const theme = isDark ? darkTheme : lightTheme;
      
      // Set CSS custom properties
      Object.entries(theme.colors).forEach(([category, colors]) => {
        Object.entries(colors).forEach(([name, value]) => {
          root.style.setProperty(`--color-${category}-${name}`, value);
        });
      });
    }
  }, [isDark, mounted]);

  const toggleTheme = () => setIsDark(!isDark);
  const setTheme = (theme: 'light' | 'dark') => setIsDark(theme === 'dark');

  const theme = isDark ? darkTheme : lightTheme;

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
