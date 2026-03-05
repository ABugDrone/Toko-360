'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeConfig, defaultTheme, themePresets, accentColors } from '@/lib/theme-presets';

interface ThemeContextType {
  theme: ThemeConfig;
  updateTheme: (updates: Partial<ThemeConfig>) => void;
  toggleMode: () => void;
  applyThemePreset: (preset: keyof typeof themePresets) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme);
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID from auth session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('toko_auth_session');
      if (session) {
        try {
          const parsed = JSON.parse(session);
          setUserId(parsed.user?.id || null);
        } catch {
          setUserId(null);
        }
      }
    }
  }, []);

  // Initialize theme from localStorage (user-specific)
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && userId) {
      const savedTheme = localStorage.getItem(`toko_theme_config_${userId}`);
      if (savedTheme) {
        try {
          setTheme(JSON.parse(savedTheme));
        } catch {
          setTheme(defaultTheme);
        }
      } else {
        // Check for old global theme and migrate it
        const oldTheme = localStorage.getItem('toko_theme_config');
        if (oldTheme) {
          try {
            const parsed = JSON.parse(oldTheme);
            setTheme(parsed);
            // Save to user-specific key
            localStorage.setItem(`toko_theme_config_${userId}`, oldTheme);
          } catch {
            setTheme(defaultTheme);
          }
        }
      }
    }
  }, [userId]);

  // Apply theme to document
  useEffect(() => {
    if (mounted && typeof window !== 'undefined' && userId) {
      const root = document.documentElement;
      
      // Remove all theme classes
      root.classList.remove('light', 'dark');
      Object.keys(themePresets).forEach(preset => {
        root.classList.remove(`theme-${preset}`);
      });
      Object.keys(accentColors).forEach(color => {
        root.classList.remove(`accent-${color}`);
      });
      root.classList.remove('animated', 'simple');
      
      // Add current theme classes
      root.classList.add(theme.mode);
      root.classList.add(`theme-${theme.style}`);
      root.classList.add(`accent-${theme.accentColor}`);
      root.classList.add(theme.animationStyle);
      
      // Apply CSS variables
      const preset = themePresets[theme.style];
      const colors = preset.colors[theme.mode];
      const accent = accentColors[theme.accentColor][theme.mode];
      
      root.style.setProperty('--theme-primary', colors.primary);
      root.style.setProperty('--theme-secondary', colors.secondary);
      root.style.setProperty('--theme-background', colors.background);
      root.style.setProperty('--theme-surface', colors.surface);
      root.style.setProperty('--theme-text', colors.text);
      root.style.setProperty('--theme-border', colors.border);
      root.style.setProperty('--theme-accent', accent);
      
      // Save to user-specific localStorage
      localStorage.setItem(`toko_theme_config_${userId}`, JSON.stringify(theme));
    }
  }, [theme, mounted, userId]);

  const updateTheme = (updates: Partial<ThemeConfig>) => {
    setTheme(prev => ({ ...prev, ...updates }));
  };

  const toggleMode = () => {
    setTheme(prev => ({ ...prev, mode: prev.mode === 'dark' ? 'light' : 'dark' }));
  };

  const applyThemePreset = (preset: keyof typeof themePresets) => {
    setTheme(prev => ({ ...prev, style: preset }));
  };

  const value: ThemeContextType = {
    theme,
    updateTheme,
    toggleMode,
    applyThemePreset,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
