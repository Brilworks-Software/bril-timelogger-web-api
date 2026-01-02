import { useMutation } from '@tanstack/react-query';
import api from '../services/api';

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  username: string;
  role: string;
  expiresIn: number;
}

export function useLogin() {
  // Only use mutation if we're in the browser (not during SSR/build)
  if (typeof window === 'undefined') {
    // Return a mock mutation during SSR/build
    return {
      mutate: () => {},
      status: 'idle' as const,
      isSuccess: false,
      isError: false,
      error: null,
      data: undefined,
    };
  }

  const mutation = useMutation<
    LoginResponse,
    Error,
    LoginRequest
  >({
    mutationFn: async (data: LoginRequest) => {
      const response = await api.post<LoginResponse>(
        '/auth/login',
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Token is stored in httpOnly cookie by the server
      if (typeof window !== 'undefined') {
        localStorage.setItem('username', data.username);
      }
    },
  });

  return mutation;
} 