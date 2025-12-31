import api from './api';
import { AxiosError } from 'axios';
import { format, startOfDay, endOfDay, subWeeks, subMonths } from 'date-fns';

export interface TimeBasedActivity {
  timeUnit: string;
  value: number;
}

export interface DashboardStats {
  activeUsers: number;
  totalHoursLogged: number;
  activityPercentage: number;
  timeBasedActivity: TimeBasedActivity[];
}

export type DateRangeType = 'day' | 'week' | 'month' | 'custom';

export interface DateRange {
  type: DateRangeType;
  startDate?: Date;
  endDate?: Date;
}

const getDateRangeParams = (dateRange: DateRange): { fromDate: string; toDate: string } | Record<string, never> => {
  const today = new Date();
  let start: Date;
  let end: Date;

  switch (dateRange.type) {
    case 'day': {
      start = startOfDay(today);
      end = endOfDay(today);
      break;
    }
    case 'week': {
      start = startOfDay(subWeeks(today, 1));
      end = endOfDay(today);
      break;
    }
    case 'month': {
      start = startOfDay(subMonths(today, 1));
      end = endOfDay(today);
      break;
    }
    case 'custom': {
      if (!dateRange.startDate || !dateRange.endDate) {
        return {};
      }
      // Check if date range is within 60 days
      const diffInDays = Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffInDays > 60) {
        throw new Error('Date range cannot exceed 60 days');
      }
      start = startOfDay(dateRange.startDate);
      end = endOfDay(dateRange.endDate);
      break;
    }
    default:
      return {};
  }

  return {
    fromDate: start.toISOString(),
    toDate: end.toISOString()
  };
};

export const getDashboardStats = async (dateRange: DateRange): Promise<DashboardStats> => {
  try {
    const params = getDateRangeParams(dateRange);
    const response = await api.get<DashboardStats>('/admin/dashboard/stats', { params });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Error fetching dashboard stats:', axiosError);
    if (axiosError.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response data:', axiosError.response.data);
      console.error('Error response status:', axiosError.response.status);
      console.error('Error response headers:', axiosError.response.headers);
    } else if (axiosError.request) {
      // The request was made but no response was received
      console.error('No response received:', axiosError.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', axiosError.message);
    }
    throw axiosError;
  }
}; 