import React from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/contexts/ToastContext';
import { ReportFilters } from './types';
import { downloadInactivityLog, downloadReport } from '../../../services/reportService';

interface InactivityLogReportProps {
  loading: boolean;
  filters: Partial<ReportFilters>;
}

const InactivityLogReport: React.FC<InactivityLogReportProps> = ({ loading, filters }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const handleExport = async (exportFilters: Partial<ReportFilters>) => {
    if (!exportFilters.fromDate || !exportFilters.toDate) {
      showToast(t('reports.dateRangeRequired'), 'error');
      return;
    }
    try {
      const data = await downloadInactivityLog(exportFilters as ReportFilters);
      downloadReport(data, 'inactivity_log.xlsx');
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

export default InactivityLogReport; 