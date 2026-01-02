import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Box, CircularProgress, Backdrop } from '@mui/material';
import { loadingManager } from '../utils/loadingManager';

interface LoadingContextType {
  setLoading: (loading: boolean) => void;
  isLoading: boolean;
  setDelay: (ms: number) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: React.ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const setDelay = useCallback((ms: number) => {
    loadingManager.setDelay(ms);
  }, []);

  useEffect(() => {
    // Subscribe to loading manager updates
    const unsubscribe = loadingManager.subscribe(setLoading);
    return () => {
      unsubscribe();
    };
  }, [setLoading]);

  return (
    <LoadingContext.Provider value={{ setLoading, isLoading, setDelay }}>
      {children}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
        open={isLoading}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <CircularProgress color="primary" size={60} />
        </Box>
      </Backdrop>
    </LoadingContext.Provider>
  );
};

