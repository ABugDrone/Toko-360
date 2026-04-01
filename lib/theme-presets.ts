// Theme Presets for Toko 360

export type ThemeStyle = 
  | 'corporate'
  | 'neon'
  | 'cyberpunk'
  | 'retro'
  | 'windows-xp'
  | 'windows-95'
  | 'windows-11'
  | 'apple-os'
  | 'google-workspace';

export type AccentColor = 
  | 'cyan'
  | 'magenta'
  | 'lemon-green'
  | 'orange'
  | 'purple'
  | 'blue'
  | 'red'
  | 'pink';

export type AnimationStyle = 'animated' | 'simple';

export interface ThemeConfig {
  style: ThemeStyle;
  accentColor: AccentColor;
  animationStyle: AnimationStyle;
  mode: 'light' | 'dark';
}

export const defaultTheme: ThemeConfig = {
  style: 'corporate',
  accentColor: 'blue',
  animationStyle: 'simple',
  mode: 'dark',
};

export const themePresets = {
  corporate: {
    name: 'Corporate',
    description: 'Professional and clean design',
    colors: {
      light: {
        primary: '#2563eb',
        secondary: '#64748b',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#0f172a',
        border: '#e2e8f0',
      },
      dark: {
        primary: '#3b82f6',
        secondary: '#94a3b8',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f1f5f9',
        border: '#334155',
      },
    },
  },
  neon: {
    name: 'Neon',
    description: 'Vibrant neon glow effects',
    colors: {
      light: {
        primary: '#00d9ff',
        secondary: '#ff00ff',
        background: '#f8fafc',
        surface: '#ffffff',
        text: '#0f172a',
        border: '#e2e8f0',
      },
      dark: {
        primary: '#00d9ff',
        secondary: '#ff00ff',
        background: '#0a0f0a',
        surface: '#111a11',
        text: '#ffffff',
        border: 'rgba(0, 217, 255, 0.3)',
      },
    },
  },
  cyberpunk: {
    name: 'Cyberpunk',
    description: 'Futuristic cyberpunk aesthetic',
    colors: {
      light: {
        primary: '#ff0080',
        secondary: '#00ffff',
        background: '#f0f0f0',
        surface: '#ffffff',
        text: '#1a1a1a',
        border: '#d0d0d0',
      },
      dark: {
        primary: '#ff0080',
        secondary: '#00ffff',
        background: '#0d0221',
        surface: '#1a0b2e',
        text: '#f0f0f0',
        border: 'rgba(255, 0, 128, 0.3)',
      },
    },
  },
  retro: {
    name: 'Retro',
    description: 'Vintage 80s inspired',
    colors: {
      light: {
        primary: '#ff6b35',
        secondary: '#f7931e',
        background: '#fef6e4',
        surface: '#fffffe',
        text: '#001858',
        border: '#f3d2c1',
      },
      dark: {
        primary: '#ff6b35',
        secondary: '#f7931e',
        background: '#001858',
        surface: '#172c66',
        text: '#fef6e4',
        border: '#8bd3dd',
      },
    },
  },
  'windows-xp': {
    name: 'Windows XP',
    description: 'Classic Windows XP look',
    colors: {
      light: {
        primary: '#0078d7',
        secondary: '#5eac24',
        background: '#ece9d8',
        surface: '#ffffff',
        text: '#000000',
        border: '#0054e3',
      },
      dark: {
        primary: '#0078d7',
        secondary: '#5eac24',
        background: '#1e1e1e',
        surface: '#2d2d2d',
        text: '#ffffff',
        border: '#0078d7',
      },
    },
  },
  'windows-95': {
    name: 'Windows 95',
    description: 'Nostalgic Windows 95 style',
    colors: {
      light: {
        primary: '#000080',
        secondary: '#008080',
        background: '#008080',
        surface: '#c0c0c0',
        text: '#000000',
        border: '#808080',
      },
      dark: {
        primary: '#000080',
        secondary: '#008080',
        background: '#000000',
        surface: '#808080',
        text: '#ffffff',
        border: '#c0c0c0',
      },
    },
  },
  'windows-11': {
    name: 'Windows 11',
    description: 'Modern Windows 11 design',
    colors: {
      light: {
        primary: '#0067c0',
        secondary: '#8ab4f8',
        background: '#f3f3f3',
        surface: '#ffffff',
        text: '#1f1f1f',
        border: '#e5e5e5',
      },
      dark: {
        primary: '#4cc2ff',
        secondary: '#8ab4f8',
        background: '#202020',
        surface: '#2c2c2c',
        text: '#ffffff',
        border: '#3d3d3d',
      },
    },
  },
  'apple-os': {
    name: 'Apple OS',
    description: 'macOS inspired design',
    colors: {
      light: {
        primary: '#007aff',
        secondary: '#5ac8fa',
        background: '#f5f5f7',
        surface: '#ffffff',
        text: '#1d1d1f',
        border: '#d2d2d7',
      },
      dark: {
        primary: '#0a84ff',
        secondary: '#64d2ff',
        background: '#1c1c1e',
        surface: '#2c2c2e',
        text: '#f5f5f7',
        border: '#38383a',
      },
    },
  },
  'google-workspace': {
    name: 'Google Workspace',
    description: 'Google Material Design',
    colors: {
      light: {
        primary: '#1a73e8',
        secondary: '#34a853',
        background: '#ffffff',
        surface: '#f8f9fa',
        text: '#202124',
        border: '#dadce0',
      },
      dark: {
        primary: '#8ab4f8',
        secondary: '#81c995',
        background: '#202124',
        surface: '#292a2d',
        text: '#e8eaed',
        border: '#5f6368',
      },
    },
  },
};

export const accentColors = {
  cyan: {
    name: 'Cyan',
    light: '#06b6d4',
    dark: '#22d3ee',
  },
  magenta: {
    name: 'Magenta',
    light: '#d946ef',
    dark: '#e879f9',
  },
  'lemon-green': {
    name: 'Lemon Green',
    light: '#84cc16',
    dark: '#a3e635',
  },
  orange: {
    name: 'Orange',
    light: '#f97316',
    dark: '#fb923c',
  },
  purple: {
    name: 'Purple',
    light: '#a855f7',
    dark: '#c084fc',
  },
  blue: {
    name: 'Blue',
    light: '#3b82f6',
    dark: '#60a5fa',
  },
  red: {
    name: 'Red',
    light: '#ef4444',
    dark: '#f87171',
  },
  pink: {
    name: 'Pink',
    light: '#ec4899',
    dark: '#f472b6',
  },
};
