import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00A8E8', // Bright Cyan/Blue for CTA buttons and accents
      light: '#0BC5EA',
      dark: '#0096CC',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#8B5CF6', // Purple/Violet for UI elements
      light: '#A78BFA',
      dark: '#7C3AED',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#10B981', // Green
      light: '#34D399',
      dark: '#059669',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#F5A623', // Gold/Yellow for icons and highlights
      light: '#FBBF24',
      dark: '#D97706',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FFFFFF', // White main background
      paper: '#FFFFFF', // White for cards and sections
    },
    text: {
      primary: '#2C3E50', // Dark Gray/Charcoal for text
      secondary: '#757575', // Medium Gray for secondary text
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
  },
});

export default theme; 