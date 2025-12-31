'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import TimeTrackingSummaryDashboard from './TimeTrackingSummaryDashboard';
import UserScreenshots from './UserScreenshots';

const TimeTrackingConditional: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>{t('common.loading')}</div>;
  }

  if (!user) {
    return null;
  }

  return user.role === 'ROLE_ADMIN' ? <TimeTrackingSummaryDashboard /> : <UserScreenshots />;
};

export default TimeTrackingConditional; 