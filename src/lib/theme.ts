import { createTheme, Theme } from '@mui/material/styles';
import { type CustomTheme } from '@/types';

// Extended theme interface für custom properties
declare module '@mui/material/styles' {
  interface Theme {
    custom: {
      arena: {
        modelCard: {
          backgroundColor: string;
          borderColor: string;
          headerColor: string;
        };
        response: {
          backgroundColor: string;
          streamingIndicator: string;
          completedIndicator: string;
        };
        cost: {
          live: string;
          final: string;
          savings: string;
        };
      };
    };
  }

  interface ThemeOptions {
    custom?: {
      arena?: {
        modelCard?: {
          backgroundColor?: string;
          borderColor?: string;
          headerColor?: string;
        };
        response?: {
          backgroundColor?: string;
          streamingIndicator?: string;
          completedIndicator?: string;
        };
        cost?: {
          live?: string;
          final?: string;
          savings?: string;
        };
      };
    };
  }
}

// Light Theme Configuration
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
      contrastText: '#ffffff',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.1rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '0.875rem',
          fontWeight: 500,
          textTransform: 'none',
        },
        contained: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontSize: '0.75rem',
        },
      },
    },
  },
  custom: {
    arena: {
      modelCard: {
        backgroundColor: '#ffffff',
        borderColor: '#e0e0e0',
        headerColor: '#1976d2',
      },
      response: {
        backgroundColor: '#f8f9fa',
        streamingIndicator: '#2e7d32',
        completedIndicator: '#1976d2',
      },
      cost: {
        live: '#ed6c02',
        final: '#2e7d32',
        savings: '#1976d2',
      },
    },
  },
});

// Dark Theme Configuration
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
      light: '#bbdefb',
      dark: '#64b5f6',
      contrastText: '#000000',
    },
    secondary: {
      main: '#f48fb1',
      light: '#f8bbd9',
      dark: '#f06292',
      contrastText: '#000000',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
    success: {
      main: '#66bb6a',
      light: '#81c784',
      dark: '#4caf50',
    },
    warning: {
      main: '#ffa726',
      light: '#ffb74d',
      dark: '#ff9800',
    },
    error: {
      main: '#f44336',
      light: '#ef5350',
      dark: '#e53935',
    },
    info: {
      main: '#29b6f6',
      light: '#4fc3f7',
      dark: '#039be5',
    },
  },
  typography: lightTheme.typography,
  shape: lightTheme.shape,
  components: {
    ...lightTheme.components,
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backgroundColor: '#1e1e1e',
        },
      },
    },
  },
  custom: {
    arena: {
      modelCard: {
        backgroundColor: '#2a2a2a',
        borderColor: '#404040',
        headerColor: '#90caf9',
      },
      response: {
        backgroundColor: '#262626',
        streamingIndicator: '#66bb6a',
        completedIndicator: '#90caf9',
      },
      cost: {
        live: '#ffa726',
        final: '#66bb6a',
        savings: '#90caf9',
      },
    },
  },
});

// Responsive Breakpoints
export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};

// Common spacing values
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Animation presets
export const animations = {
  fadeIn: {
    '@keyframes fadeIn': {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    animation: 'fadeIn 0.3s ease-in-out',
  },
  slideInUp: {
    '@keyframes slideInUp': {
      from: { transform: 'translateY(20px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
    animation: 'slideInUp 0.4s ease-out',
  },
  pulse: {
    '@keyframes pulse': {
      '0%': { opacity: 1 },
      '50%': { opacity: 0.7 },
      '100%': { opacity: 1 },
    },
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  typing: {
    '@keyframes typing': {
      '0%': { borderRightColor: 'transparent' },
      '50%': { borderRightColor: 'currentColor' },
      '100%': { borderRightColor: 'transparent' },
    },
    animation: 'typing 1s ease-in-out infinite',
  },
};

// Theme Utility Functions
export const getTheme = (mode: 'light' | 'dark'): Theme => {
  return mode === 'light' ? lightTheme : darkTheme;
};

export const createCustomTheme = (config: Partial<CustomTheme>): Theme => {
  const baseTheme = getTheme(config.mode || 'light');
  
  return createTheme({
    ...baseTheme,
    palette: {
      ...baseTheme.palette,
      primary: {
        ...baseTheme.palette.primary,
        main: config.primaryColor || baseTheme.palette.primary.main,
      },
      background: {
        ...baseTheme.palette.background,
        default: config.backgroundColor || baseTheme.palette.background.default,
      },
    },
  });
};
