'use client';

import React from 'react';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  Chip,
} from '@mui/material';
import { GitHub, Settings, TrendingUp } from '@mui/icons-material';
import { useTheme } from '@/components/providers/ThemeProvider';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  title = "KI Model Arena",
  subtitle = "Vergleiche AI-Modelle in Echtzeit" 
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          color: 'text.primary'
        }}
      >
        <Toolbar>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ flexGrow: 1 }}>
            <TrendingUp sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            </Box>
            <Chip 
              label="Beta" 
              size="small" 
              color="secondary" 
              variant="outlined"
              sx={{ ml: 1 }}
            />
          </Stack>
          
          <Stack direction="row" spacing={1}>
            <Tooltip title="GitHub Repository">
              <IconButton 
                color="inherit"
                href="https://github.com/mdeutschel/ki-meetup"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitHub />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Settings">
              <IconButton color="inherit">
                <Settings />
              </IconButton>
            </Tooltip>
            
            <ConditionalThemeToggle />
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Container maxWidth="xl">
          {children}
        </Container>
      </Box>

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          py: 2, 
          px: 3, 
          borderTop: 1, 
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <Container maxWidth="xl">
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            justifyContent="space-between" 
            alignItems="center"
            spacing={2}
          >
            <Typography variant="body2" color="text.secondary">
              © 2024 KI Meetup - Entwickelt für Model-Vergleiche
            </Typography>
            <Stack direction="row" spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Powered by OpenAI & Anthropic APIs
              </Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

// Common Layout Components
export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ title, subtitle, action }) => (
  <Stack 
    direction={{ xs: 'column', sm: 'row' }} 
    justifyContent="space-between" 
    alignItems={{ xs: 'flex-start', sm: 'center' }}
    spacing={2}
    sx={{ mb: 4 }}
  >
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body1" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
    {action && <Box>{action}</Box>}
  </Stack>
);

export const Section: React.FC<{
  title?: string;
  children: React.ReactNode;
  spacing?: number;
}> = ({ title, children, spacing = 3 }) => (
  <Box sx={{ mb: spacing }}>
    {title && (
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2 }}>
        {title}
      </Typography>
    )}
    {children}
  </Box>
);

// Conditional Theme Toggle to avoid SSR issues
const ConditionalThemeToggle: React.FC = () => {
  // Always call ALL hooks at the top level, in the same order
  const [mounted, setMounted] = React.useState(false);
  
  // Always call useTheme hook - don't put it in conditions or try-catch
  let themeContext;
  try {
    themeContext = useTheme();
  } catch (error) {
    themeContext = null;
  }

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state during SSR and initial mount
  if (!mounted) {
    return (
      <Tooltip title="Theme wird geladen...">
        <IconButton color="inherit" disabled>
          <Settings />
        </IconButton>
      </Tooltip>
    );
  }

  // If theme context is not available, show fallback
  if (!themeContext) {
    return (
      <Tooltip title="Theme toggle nicht verfügbar">
        <IconButton color="inherit" disabled>
          <Settings />
        </IconButton>
      </Tooltip>
    );
  }

  const { mode, toggleTheme } = themeContext;
    
  return (
    <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
      <IconButton 
        onClick={toggleTheme} 
        color="inherit"
        sx={{ 
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.1)',
          }
        }}
      >
        {mode === 'light' ? 
          <span>🌙</span> : 
          <span>☀️</span>
        }
      </IconButton>
    </Tooltip>
  );
};
