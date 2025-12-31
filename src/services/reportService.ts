import api from './api';
import { ReportFilters } from '../components/TimeTracking/Reports/types';

export const fetchInactivityLog = async (filters: ReportFilters) => {
  const params: any = {
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  };
  if (filters.projectId) params.projectId = filters.projectId;
  if (filters.taskId) params.taskId = filters.taskId;
  
  const response = await api.get('/admin/reports/inactivity-log', { params });
  return response.data;
};

export const fetchUserActivity = async (filters: ReportFilters) => {
  const params: any = {
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    format: filters.format || 'XLSX',
  };
  if (filters.projectId) params.projectId = filters.projectId;
  if (filters.taskId) params.taskId = filters.taskId;
  
  const response = await api.get('/admin/reports/user-activity-export', {
    params,
    responseType: 'blob',
  });
  return response.data;
};

export const fetchUserProductivity = async (filters: Partial<ReportFilters>) => {
  const params: any = {
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  };
  if (filters.projectId) params.projectId = filters.projectId;
  if (filters.taskId) params.taskId = filters.taskId;
  
  const response = await api.get('/admin/reports/user-productivity', { params });
  return response.data;
};

export const downloadInactivityLog = async (filters: ReportFilters) => {
  const params: any = {
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  };
  if (filters.projectId) params.projectId = filters.projectId;
  if (filters.taskId) params.taskId = filters.taskId;
  
  const response = await api.get('/admin/reports/inactivity-log', {
    params,
    responseType: 'blob',
  });
  return response.data;
};

export const downloadUserActivity = async (filters: ReportFilters) => {
  const params: any = {
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  };
  if (filters.projectId) params.projectId = filters.projectId;
  if (filters.taskId) params.taskId = filters.taskId;
  
  const response = await api.get('/admin/reports/user-activity-export', {
    params,
    responseType: 'blob',
  });
  return response.data;
};

export const downloadReport = (data: Blob, filename: string) => {
  const url = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}; 