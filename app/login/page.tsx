'use client';

import { useEffect, useState } from 'react';
import dynamicImport from 'next/dynamic';

// Disable SSR for Login page to avoid QueryClient/ToastProvider issues during build
const Login = dynamicImport(() => import('@/pages/Login'), {
  ssr: false,
});

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return <Login />;
}

// Disable static generation for this page
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

