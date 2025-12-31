import api from './api';

export interface Task {
  id: string;
  name: string;
  description?: string;
  project_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  projects?: {
    id: string;
    name: string;
  };
}

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export const getTasks = async (
  page = 0,
  size = 10,
  search = '',
  sort = 'name,asc',
  projectId?: string,
  activeOnly = false
): Promise<PaginatedResponse<Task>> => {
  const params: any = { page, size, sort };
  if (search) params.search = search;
  if (projectId) params.projectId = projectId;
  if (activeOnly) params.activeOnly = 'true';

  const response = await api.get('/admin/tasks', { params });
  return response.data;
};

export const getTask = async (id: string): Promise<Task> => {
  const response = await api.get(`/admin/tasks/${id}`);
  return response.data;
};

export const createTask = async (task: {
  name: string;
  description?: string;
  projectId: string;
  isActive?: boolean;
}): Promise<Task> => {
  const response = await api.post('/admin/tasks', task);
  return response.data;
};

export const updateTask = async (
  id: string,
  task: {
    name?: string;
    description?: string;
    projectId?: string;
    isActive?: boolean;
  }
): Promise<Task> => {
  const response = await api.put(`/admin/tasks/${id}`, task);
  return response.data;
};

export const deleteTask = async (id: string): Promise<void> => {
  await api.delete(`/admin/tasks/${id}`);
};

