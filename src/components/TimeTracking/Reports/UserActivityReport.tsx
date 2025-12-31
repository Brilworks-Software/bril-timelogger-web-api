import React from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/contexts/ToastContext';
import { ReportFilters } from './types';
import { downloadUserActivity, downloadReport } from '../../../services/reportService';

interface UserActivityReportProps {
  loading: boolean;
  filters: Partial<ReportFilters>;
}

const UserActivityReport: React.FC<UserActivityReportProps> = ({ loading, filters }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const handleExport = async (exportFilters: Partial<ReportFilters>) => {
    if (!exportFilters.fromDate || !exportFilters.toDate) {
      showToast(t('reports.dateRangeRequired'), 'error');
      return;
    }
    try {
      const data = await downloadUserActivity(exportFilters as ReportFilters);
      downloadReport(data, 'user_activity.xlsx');
      showToast(t('reports.success'), 'success');
    } catch (error) {
      console.error('Failed to download report:', error);
      showToast(t('reports.errorDownloading'), 'error');
    }
  };

  return (
    <Box className="report-container">
      {/* Report content will go here */}
    </Box>
  );
};

export default UserActivityReport; 