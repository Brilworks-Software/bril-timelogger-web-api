import axios from 'axios';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  accountNonLocked: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api', // Use the Vite proxy
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // Ensure token is properly formatted
    const cleanToken = token.replace(/^"|"$/g, ''); // Remove any quotes
    config.headers.Authorization = `Bearer ${cleanToken}`;
  }
  return config;
});

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = async (credentials: LoginCredentials): Promise<{ token: string; user: User }> => {
  const response = await api.post('/auth/login', credentials);
  const { token, user } = response.data;
  localStorage.setItem('token', token);
  return { token, user };
};

export const logout = async (): Promise<void> => {
    localStorage.removeItem('token');
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Helper function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

export function isAdmin(user: User | null): boolean {
  return user?.role === 'ROLE_ADMIN';
}

export function requireAuth(): boolean {
  if (!isAuthenticated()) {
    window.location.href = '/login';
    return false;
  }
  return true;
}

export function requireAdmin(): boolean {
  if (!isAuthenticated()) {
    window.location.href = '/login';
    return false;
  }

  getCurrentUser().then(user => {
    if (!isAdmin(user)) {
      window.location.href = '/dashboard';
      return false;
    }
    return true;
  });

  return true;
} 