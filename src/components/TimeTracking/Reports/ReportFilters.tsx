import React, { useState, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DatePicker } from '@mui/x-date-pickers';
import { ReportFilters } from './types';
import { format } from 'date-fns';

interface ReportFiltersProps {
  onFilterChange: (filters: Partial<ReportFilters>) => void;
  loading?: boolean;
  showExportButton?: boolean;
  onDateChange?: (filters: Partial<ReportFilters>) => void;
  initialFilters?: Partial<ReportFilters>;
}

const ReportFiltersComponent: React.FC<ReportFiltersProps> = ({
  onFilterChange,
  loading = false,
  showExportButton = true,
  onDateChange,
  initialFilters
}) => {
  const { t } = useTranslation();
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  useEffect(() => {
    if (initialFilters?.fromDate) {
      setFromDate(new Date(initialFilters.fromDate));
    }
    if (initialFilters?.toDate) {
      setToDate(new Date(initialFilters.toDate));
    }
  }, [initialFilters]);

  const handleFromDateChange = (date: Date | null) => {
    setFromDate(date);
    if (onDateChange) {
      onDateChange({
        fromDate: date ? format(date, 'yyyy-MM-dd') : '',
        toDate: toDate ? format(toDate, 'yyyy-MM-dd') : ''
      });
    }
  };

  const handleToDateChange = (date: Date | null) => {
    setToDate(date);
    if (onDateChange) {
      onDateChange({
        fromDate: fromDate ? format(fromDate, 'yyyy-MM-dd') : '',
        toDate: date ? format(date, 'yyyy-MM-dd') : ''
      });
    }
  };

  const handleExport = () => {
    if (!fromDate || !toDate) {
      return;
    }

    onFilterChange({
      fromDate: format(fromDate, 'yyyy-MM-dd'),
      toDate: format(toDate, 'yyyy-MM-dd'),
      format: 'csv'
    });
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
      <DatePicker
        label={t('reports.fromDate')}
        value={fromDate}
        onChange={handleFromDateChange}
        disabled={loading}
        slotProps={{
          textField: {
            size: 'small'
          }
        }}
      />
      <DatePicker
        label={t('reports.toDate')}
        value={toDate}
        onChange={handleToDateChange}
        disabled={loading}
        slotProps={{
          textField: {
            size: 'small'
          }
        }}
      />
      {showExportButton && (
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={loading || !fromDate || !toDate}
        >
          {t('reports.export')}
        </Button>
      )}
    </Box>
  );
};

export default ReportFiltersComponent; 