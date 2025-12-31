'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import logo from '@/assets/brilworks.png';
import bgLogin from '@/assets/bg-login.jpg';
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
      showToast('Por favor ingrese usuario y contraseña.', 'error');
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
    <div className="flex min-h-screen w-screen">
      {/* Left side */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/3 px-8 bg-white">
        <div className="w-full max-w-md">
          <img src={logo} alt="Brilworks" className="w-full max-w-[250px] mx-auto mb-6" />
          <p className="text-base mb-6 text-center" style={{ color: '#0080FF' }}>
            Brilworks Time Logger
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={status === 'pending'}
              className="input"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#BDBDBD', color: '#2C3E50' }}
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={status === 'pending'}
              className="input"
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
          <div className="mt-8 text-sm text-center" style={{ color: '#757575' }}>
            A problem? <a href="#" className="hover:underline" style={{ color: '#0080FF' }}>Click here</a> and let us help you.
          </div>
        </div>
      </div>

      {/* Right side */}
      <div
        className="hidden md:flex w-2/3 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgLogin})` }}
      ></div>
    </div>
  );
};

export default Login;
