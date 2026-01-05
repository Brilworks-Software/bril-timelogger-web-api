'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin } from '@/hooks/useLogin';
import { useToast } from '@/contexts/ToastContext';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { mutate, status, isSuccess } = useLogin();
  const { showToast } = useToast();

  useEffect(() => {
    if (isSuccess) {
      router.push('/');
    }
  }, [isSuccess, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      showToast('Please enter username and password.', 'error');
      return;
    }
    mutate(
      { username, password },
      {
        onError: (err: unknown) => {
          const error = (err as ApiError)?.response?.data?.message || 'An error occurred';
          showToast(error, 'error');
        },
      }
    );
  };

  return (
    <div className="flex min-h-screen w-screen justify-center items-center bg-gray-100">
      <div className="w-full max-w-sm bg-white rounded shadow-md p-8">
        <h2 className="text-2xl font-semibold text-center mb-6" style={{ color: '#0080FF' }}>
          Login to Time Logger
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            disabled={status === 'pending'}
            className="input w-full"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#BDBDBD', color: '#2C3E50' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={status === 'pending'}
            className="input w-full"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#BDBDBD', color: '#2C3E50' }}
          />
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={status === 'pending'}
            style={{ backgroundColor: '#0080FF' }}
          >
            {status === 'pending' ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="mt-6 text-sm text-center" style={{ color: '#757575' }}>
          Having trouble?{' '}
          <a href="#" className="hover:underline" style={{ color: '#0080FF' }}>
            Contact support
          </a>
          .
        </div>
      </div>
    </div>
  );
};

export default Login;
