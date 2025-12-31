import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Outlet } from 'react-router-dom';

const TimeTrackingSummary: React.FC = () => (
  <Box sx={{ p: 3 }}>
    <Paper elevation={3} sx={{ p: 3 }}>
      <Outlet />
    </Paper>
  </Box>
);

export default TimeTrackingSummary; 