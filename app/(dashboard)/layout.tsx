'use client';

import React, { useState } from 'react';
import Sidebar from '@/partials/Sidebar';
import { FiUser, FiLogOut } from 'react-icons/fi';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#FAFAFA' }}>
      <Sidebar 
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="flex-1 flex flex-col min-h-screen" style={{ marginLeft: collapsed ? '5rem' : '16rem' }}>
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex items-center justify-end h-16 px-6 bg-white" style={{ borderBottom: '1px solid #E0E0E0' }}>
          <div className="flex items-center space-x-2">
            {/* Language Switcher */}
            <LanguageSwitcher />
            {/* Divider */}
            <span className="h-6 w-px bg-gray-200 mx-2" />
            {/* User Avatar and Name */}
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full flex items-center justify-center bg-gray-100">
                <FiUser size={20} style={{ color: '#757575' }} />
              </div>
              <span className="font-medium text-sm" style={{ color: '#2C3E50' }}>{user?.name || t('common.user')}</span>
            </div>
            {/* Divider */}
            <span className="h-6 w-px bg-gray-200 mx-2" />
            {/* Logout Icon */}
            <button 
              className="p-2 rounded-full transition-colors duration-150 focus:outline-none" 
              style={{ color: '#757575' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#E91E63'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#757575'}
              onClick={logout} 
              title={t('common.logout')}
            >
              <FiLogOut size={20} />
            </button>
          </div>
        </header>
        {/* Main content */}
        <main className="flex-1 p-6" style={{ backgroundColor: '#FAFAFA' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

