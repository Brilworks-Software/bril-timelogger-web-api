import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, type DashboardStats, type DateRange } from '../services/dashboardService';

export const useDashboardStats = (dateRange: DateRange) => {
  return useQuery<DashboardStats>({
    queryKey: ['dashboardStats', dateRange],
    queryFn: () => getDashboardStats(dateRange),
  });
}; 