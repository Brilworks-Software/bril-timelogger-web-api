import api from './api';

interface LoginResponse {
  token: string;
  sessionId: number;
  user: {
    username: string;
    email: string;
    name: string;
    role: string;
    accountNonLocked: boolean;
  };
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>('/auth/login', {
      username,
      password,
    });
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}; 