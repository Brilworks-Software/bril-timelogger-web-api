import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { FiUser, FiLogOut } from 'react-icons/fi';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="flex-1 flex flex-col min-h-screen" style={{ marginLeft: collapsed ? '5rem' : '16rem' }}>
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex items-center justify-end h-16 bg-white border-b border-gray-200 px-6">
          <div className="flex items-center space-x-2">
            {/* Language Switcher */}
            <LanguageSwitcher />
            {/* Divider */}
            <span className="h-6 w-px bg-gray-200 mx-2" />
            {/* User Avatar and Name */}
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <FiUser size={20} className="text-gray-400" />
              </div>
              <span className="font-medium text-gray-700 text-sm">{user?.name || t('common.user')}</span>
            </div>
            {/* Divider */}
            <span className="h-6 w-px bg-gray-200 mx-2" />
            {/* Logout Icon */}
            <button 
              className="text-gray-400 hover:text-danger p-2 rounded-full transition-colors duration-150 focus:outline-none" 
              onClick={logout} 
              title={t('common.logout')}
            >
              <FiLogOut size={20} />
            </button>
          </div>
        </header>
        {/* Main content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 