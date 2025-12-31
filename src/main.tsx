import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import * as Sentry from '@sentry/react';
import App from './App';
import theme from './theme';
import './i18n';
import './index.css';

// Initialize Sentry
Sentry.init({
  dsn: "https://17dd846722c3b54d725f50c1f1ed461f@o4509366457008128.ingest.de.sentry.io/4509370642989136",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  // Performance monitoring
  tracesSampleRate: 1.0,
  // Session replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');
const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <App />
      </LocalizationProvider>
    </ThemeProvider>
  </React.StrictMode>
);
