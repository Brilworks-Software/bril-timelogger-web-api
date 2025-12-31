import React, { useEffect, useState } from 'react';
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ReportFilters } from './types';
import { fetchUserProductivity } from '../../../services/reportService';

interface ProductivityData {
  userName: string;
  productivityScore: number;
  totalHours: number;
}

interface ProductivityReportProps {
  loading: boolean;
  filters: Partial<ReportFilters>;
}

const ProductivityReport: React.FC<ProductivityReportProps> = ({ loading, filters }) => {
  const { t } = useTranslation();
  const [data, setData] = useState<ProductivityData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!filters.fromDate || !filters.toDate) return;
      
      try {
        const response = await fetchUserProductivity(filters);
        setData(response);
      } catch (error) {
        console.error('Error fetching productivity data:', error);
      }
    };

    fetchData();
  }, [filters]);

  if (loading) {
    return <Typography>{t('common.loading')}</Typography>;
  }

  if (!data.length) {
    return <Typography>{t('reports.noData')}</Typography>;
  }

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('reports.userName')}</TableCell>
              <TableCell align="right">{t('reports.productivityScore')}</TableCell>
              <TableCell align="right">{t('reports.totalHours')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.userName}>
                <TableCell component="th" scope="row">
                  {row.userName}
                </TableCell>
                <TableCell align="right">{row.productivityScore.toFixed(1)}%</TableCell>
                <TableCell align="right">{row.totalHours.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ProductivityReport; 