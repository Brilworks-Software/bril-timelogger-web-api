import React, { useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/contexts/ToastContext';
import UserActivityReport from './UserActivityReport';
import InactivityLogReport from './InactivityLogReport';
import ProductivityReport from './ProductivityReport';
import ReportFiltersComponent from './ReportFilters';
import { ReportFilters } from './types';
import { downloadUserActivity, downloadInactivityLog, downloadReport } from '../../../services/reportService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      tabIndex={value === index ? 0 : -1}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ReportsTab: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Partial<ReportFilters>>({
    fromDate: '',
    toDate: '',
    format: 'csv'
  });

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleFilterChange = (newFilters: Partial<ReportFilters>) => {
    setFilters(newFilters);
  };

  const handleExport = async (exportFilters: Partial<ReportFilters>) => {
    if (!exportFilters.fromDate || !exportFilters.toDate) {
      showToast(t('reports.dateRangeRequired'), 'error');
      return;
    }

    try {
      setLoading(true);
      let data;
      let filename;

      switch (value) {
        case 0: // User Activity
          data = await downloadUserActivity(exportFilters as ReportFilters);
          filename = 'user_activity.xlsx';
          break;
        case 1: // Inactivity Log
          data = await downloadInactivityLog(exportFilters as ReportFilters);
          filename = 'inactivity_log.xlsx';
          break;
        default:
          throw new Error('Invalid report type');
      }

      downloadReport(data, filename);
      showToast(t('reports.success'), 'success');
    } catch (error) {
      console.error('Failed to download report:', error);
      showToast(t('reports.errorDownloading'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={value} 
          onChange={handleChange} 
          aria-label={t('reports.tabs')}
          role="tablist"
        >
          <Tab 
            label={t('reports.userActivity')} 
            id="report-tab-0"
            aria-controls="report-tabpanel-0"
            role="tab"
          />
          <Tab 
            label={t('reports.inactivityLog')} 
            id="report-tab-1"
            aria-controls="report-tabpanel-1"
            role="tab"
          />
          <Tab 
            label={t('reports.productivity')} 
            id="report-tab-2"
            aria-controls="report-tabpanel-2"
            role="tab"
          />
        </Tabs>
      </Box>
      <Box sx={{ p: 2 }}>
        <ReportFiltersComponent
          onFilterChange={handleExport}
          loading={loading}
          showExportButton={value !== 2}
          onDateChange={handleFilterChange}
          initialFilters={filters}
        />
      </Box>
      <TabPanel value={value} index={0}>
        <UserActivityReport loading={loading} filters={filters} />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <InactivityLogReport loading={loading} filters={filters} />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <ProductivityReport loading={loading} filters={filters} />
      </TabPanel>
    </Box>
  );
};

export default ReportsTab; 