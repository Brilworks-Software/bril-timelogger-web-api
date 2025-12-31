import api from './api';

export interface Project {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

export const getProjects = async (
  page = 0,
  size = 10,
  search = '',
  sort = 'name,asc',
  activeOnly = false
): Promise<PaginatedResponse<Project>> => {
  const params: any = { page, size, sort };
  if (search) params.search = search;
  if (activeOnly) params.activeOnly = 'true';

  const response = await api.get('/admin/projects', { params });
  return response.data;
};

export const getProject = async (id: string): Promise<Project> => {
  const response = await api.get(`/admin/projects/${id}`);
  return response.data;
};

export const createProject = async (project: {
  name: string;
  description?: string;
  isActive?: boolean;
}): Promise<Project> => {
  const response = await api.post('/admin/projects', project);
  return response.data;
};

export const updateProject = async (
  id: string,
  project: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }
): Promise<Project> => {
  const response = await api.put(`/admin/projects/${id}`, project);
  return response.data;
};

export const deleteProject = async (id: string): Promise<void> => {
  await api.delete(`/admin/projects/${id}`);
};

