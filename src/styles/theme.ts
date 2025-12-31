import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#0080FF', // Bright Blue for CTA buttons and accents
      light: '#3399FF',
      dark: '#0066CC',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#4A90E2', // Book Icon Blue
      light: '#6BA3E8',
      dark: '#3A7BC2',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#4CAF50', // Green
      light: '#66BB6A',
      dark: '#388E3C',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#E91E63', // Red/Pink
      light: '#EC407A',
      dark: '#C2185B',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#FFC107', // Yellow
      light: '#FFD54F',
      dark: '#F57C00',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#4A90E2', // Book Icon Blue
      light: '#6BA3E8',
      dark: '#3A7BC2',
      contrastText: '#FFFFFF',
    },
    grey: {
      50: '#FAFAFA', // Light Gray
      100: '#F5F5F5',
      200: '#EBF5FF', // Light Blue/Cyan
      300: '#E3F2FD',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#2C3E50', // Dark Gray/Charcoal
      900: '#1A1A1A', // Dark Navy/Black
    },
    text: {
      primary: '#2C3E50', // Dark Gray/Charcoal for body text
      secondary: '#757575', // Medium Gray for secondary text
    },
    background: {
      default: '#FFFFFF', // White main background
      paper: '#FFFFFF', // White for cards and sections
    },
  },
  typography: {
    fontFamily: 'Roboto, Open Sans, system-ui, sans-serif',
    h1: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.2,
    },
    h3: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.2,
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: '36px',
          minWidth: '36px',
          padding: '0.5rem 1rem',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            minHeight: '36px',
          },
        },
      },
    },
  },
}); 