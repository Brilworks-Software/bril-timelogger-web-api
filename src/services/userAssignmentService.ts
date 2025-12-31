import api from './api';
import { Project } from './projectService';
import { Task } from './taskService';

export interface UserProject {
  id: string;
  assigned_at: string;
  projects: Project;
}

export interface UserTask {
  id: string;
  assigned_at: string;
  tasks: Task;
}

export interface UserDefaults {
  defaultProjectId: string | null;
  defaultTaskId: string | null;
  defaultProject: Project | null;
  defaultTask: Task | null;
}

// Admin endpoints
export const getUserProjects = async (userId: string): Promise<UserProject[]> => {
  const response = await api.get(`/admin/users/${userId}/projects`);
  return response.data;
};

export const assignProjectsToUser = async (
  userId: string,
  projectIds: string[]
): Promise<UserProject[]> => {
  const response = await api.post(`/admin/users/${userId}/projects`, { projectIds });
  return response.data;
};

export const getUserTasks = async (userId: string): Promise<UserTask[]> => {
  const response = await api.get(`/admin/users/${userId}/tasks`);
  return response.data;
};

export const assignTasksToUser = async (
  userId: string,
  taskIds: string[]
): Promise<UserTask[]> => {
  const response = await api.post(`/admin/users/${userId}/tasks`, { taskIds });
  return response.data;
};

export const getUserDefaults = async (userId: string): Promise<UserDefaults> => {
  const response = await api.get(`/admin/users/${userId}/defaults`);
  return response.data;
};

export const setUserDefaults = async (
  userId: string,
  defaults: {
    defaultProjectId?: string | null;
    defaultTaskId?: string | null;
  }
): Promise<UserDefaults> => {
  const response = await api.put(`/admin/users/${userId}/defaults`, defaults);
  return response.data;
};

// User endpoints (for current user)
export const getMyProjects = async (): Promise<UserProject[]> => {
  const response = await api.get('/users/me/projects');
  return response.data;
};

export const getMyTasks = async (projectId?: string): Promise<UserTask[]> => {
  const params = projectId ? { projectId } : {};
  const response = await api.get('/users/me/tasks', { params });
  return response.data;
};

export const getMyDefaults = async (): Promise<UserDefaults> => {
  const response = await api.get('/users/me/defaults');
  return response.data;
};

