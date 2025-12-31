'use client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@/styles/theme';
import i18n from '@/i18n';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ToastProvider } from '@/contexts/ToastContext';
import './globals.css';
import { useState } from 'react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html lang="en">
      <head>
        <title>Brilworks</title>
        <meta name="description" content="Brilworks Tracking System" />
      </head>
      <body style={{ backgroundColor: '#FFFFFF', color: '#2C3E50' }}>
        <ErrorBoundary>
          <I18nextProvider i18n={i18n}>
            <ThemeProvider theme={theme}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <CssBaseline />
                <QueryClientProvider client={queryClient}>
                  <ToastProvider>
                    {children}
                  </ToastProvider>
                </QueryClientProvider>
              </LocalizationProvider>
            </ThemeProvider>
          </I18nextProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
