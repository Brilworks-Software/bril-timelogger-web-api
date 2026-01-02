import api from './api';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'ROLE_ADMIN' | 'user';
  accountNonLocked: boolean;
  companyId?: number | null;
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

export const getUsers = async (page = 0, size = 10, search = '', sort = 'name,asc'): Promise<PaginatedResponse<User>> => {
  const response = await api.get('/admin/users', {
    params: { 
      page, 
      size, 
      sort,
      search: search.trim() || undefined // Only include search if it's not empty
    }
  });
  return response.data;
};

export const getUser = async (userId: string): Promise<User & { projects: any[]; tasks: any[]; defaultProject: any; defaultTask: any }> => {
  const response = await api.get(`/admin/users/${userId}`);
  return response.data;
};

export interface CreateUserData {
  username: string;
  password: string;
  name: string;
  email?: string;
  role?: string;
  accountNonLocked?: boolean;
  companyId?: number | null;
  projectIds?: string[];
}

export const createUser = async (userData: CreateUserData): Promise<User> => {
  const response = await api.post('/admin/users', userData);
  return response.data;
};

export interface UpdateUserData {
  username?: string;
  password?: string;
  name?: string;
  email?: string;
  role?: string;
  accountNonLocked?: boolean;
  companyId?: number | null;
  projectIds?: string[];
}

export const updateUser = async (userId: string, userData: UpdateUserData): Promise<User> => {
  const response = await api.put(`/admin/users/${userId}`, userData);
  return response.data;
};

export const deleteUser = async (userId: string): Promise<void> => {
  await api.delete(`/admin/users/${userId}`);
}; 