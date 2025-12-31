import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

const ErrorFallback: React.FC<{ error: Error | null }> = ({ error }) => {
  const { t } = useTranslation();

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        p: 3,
      }}
    >
      <Alert
        severity="error"
        sx={{
          mb: 2,
          width: '100%',
          maxWidth: '600px',
        }}
      >
        <Typography variant="h6" gutterBottom>
          {t('common.error')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error?.message || t('common.unexpectedError')}
        </Typography>
      </Alert>
      <Button
        variant="contained"
        color="primary"
        onClick={handleReload}
        sx={{ mt: 2 }}
      >
        {t('common.reload')}
      </Button>
    </Box>
  );
};

export default ErrorBoundary; 