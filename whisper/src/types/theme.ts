export interface Theme {
  name: 'light' | 'dark';
  colors: {
    // Background colors
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
      card: string;
      overlay: string;
    };
    // Text colors
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      inverse: string;
    };
    // Border colors
    border: {
      primary: string;
      secondary: string;
      focus: string;
    };
    // Brand colors
    brand: {
      primary: string;
      secondary: string;
      accent: string;
    };
    // Status colors
    status: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
    // Interactive colors
    interactive: {
      hover: string;
      active: string;
      disabled: string;
    };
  };
}

export const lightTheme: Theme = {
  name: 'light',
  colors: {
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      card: '#ffffff',
      overlay: 'rgba(15, 23, 42, 0.1)',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      tertiary: '#64748b',
      inverse: '#ffffff',
    },
    border: {
      primary: '#e2e8f0',
      secondary: '#cbd5e1',
      focus: '#3b82f6',
    },
    brand: {
      primary: '#3b82f6',
      secondary: '#1e40af',
      accent: '#06b6d4',
    },
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    interactive: {
      hover: '#f1f5f9',
      active: '#e2e8f0',
      disabled: '#f1f5f9',
    },
  },
};

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    background: {
      primary: '#0f172a',
      secondary: '#1e293b',
      tertiary: '#334155',
      card: '#1e293b',
      overlay: 'rgba(15, 23, 42, 0.8)',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      tertiary: '#94a3b8',
      inverse: '#0f172a',
    },
    border: {
      primary: '#334155',
      secondary: '#475569',
      focus: '#60a5fa',
    },
    brand: {
      primary: '#60a5fa',
      secondary: '#3b82f6',
      accent: '#22d3ee',
    },
    status: {
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#60a5fa',
    },
    interactive: {
      hover: '#334155',
      active: '#475569',
      disabled: '#1e293b',
    },
  },
};
