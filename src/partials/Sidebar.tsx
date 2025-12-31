'use client';

import React from 'react';
import logoWhite from '../assets/brilworks.png';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  FaChevronLeft, 
  FaChevronRight, 
  FaChartBar, 
  FaImage, 
  FaUsers, 
  FaClock,
  FaHistory,
  FaFileAlt,
  FaFolder,
  FaTasks
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed, mobileOpen = false, setMobileOpen }) => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [expandedMenu, setExpandedMenu] = React.useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'ROLE_ADMIN';

  // Detect mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const menuItems = [
    { 
      label: t('sidebar.timeTracker'), 
      icon: <FaClock />, 
      to: "/time-tracking",
      subItems: [
        ...(isAdmin ? [{ label: t('sidebar.summary'), icon: <FaChartBar />, to: "/time-tracking/summary" }] : []),
        { label: t('sidebar.screenshots'), icon: <FaImage />, to: "/time-tracking/screenshots" },
        { label: t('sidebar.timeline'), icon: <FaHistory />, to: "/time-tracking/activity" },
        ...(isAdmin ? [{ label: t('sidebar.reports'), icon: <FaFileAlt />, to: "/time-tracking/reports" }] : [])
      ]
    },
    ...(isAdmin ? [{ 
      label: t('sidebar.users'), 
      icon: <FaUsers />, 
      to: "/users",
      subItems: []
    }] : []),
    ...(isAdmin ? [{ 
      label: t('sidebar.projects', 'Projects'), 
      icon: <FaFolder />, 
      to: "/projects",
      subItems: []
    }] : []),
    ...(isAdmin ? [{ 
      label: t('sidebar.tasks', 'Tasks'), 
      icon: <FaTasks />, 
      to: "/tasks",
      subItems: []
    }] : [])
  ];

  const toggleMenu = (label: string) => {
    setExpandedMenu(expandedMenu === label ? null : label);
  };

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };

  // Sidebar classes
  const sidebarBase = `fixed top-0 left-0 h-full text-white z-30 shadow-none flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`;
  const sidebarMobile = isMobile
    ? `${mobileOpen ? 'translate-x-0' : '-translate-x-full'} w-64 md:hidden z-50`
    : '';

  return (
    <aside
      className={
        isMobile
          ? `${sidebarBase} ${sidebarMobile} transform transition-transform`
          : sidebarBase
      }
      style={{
        ...(isMobile ? { position: 'fixed' } : {}),
        background: 'linear-gradient(180deg, #0080FF 0%, #0A1929 100%)', // Blue to Dark Navy gradient
        borderRight: '1px solid #1A1A1A'
      }}
    >
      <div className={`flex items-center justify-between px-4 py-4 ${collapsed ? 'justify-center' : ''}`} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Image src={logoWhite} alt="Brilworks" className={`transition-all duration-300 ${collapsed ? 'h-8' : 'h-10'} w-auto`} style={{ height: collapsed ? '2rem' : '2.5rem', width: 'auto' }} />
        {!collapsed && (
          <div className="ml-2">
            <div className="text-xs opacity-80">Version 1.0.0</div>
          </div>
        )}
        <button
          className={`ml-auto p-2 rounded-full transition-colors duration-200 focus:outline-none ${collapsed ? '' : 'ml-4'}`}
          style={{ color: '#FFFFFF' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <FaChevronRight size={20} /> : <FaChevronLeft size={20} />}
        </button>
        {/* Mobile close button */}
        {isMobile && setMobileOpen && (
          <button
            className="ml-2 p-2 rounded-full transition-colors duration-200 focus:outline-none md:hidden"
            style={{ color: '#FFFFFF' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1A2332'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <span className="text-lg">&times;</span>
          </button>
        )}
      </div>
      <div className={`px-4 pt-6 pb-2 text-xs font-semibold tracking-widest opacity-70 select-none ${collapsed ? 'hidden' : ''}`}>{t('sidebar.menu')}</div>
      <nav className="flex-1 px-2 mt-2 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.filter(Boolean).map((item) => (
            <li key={item.label} className="relative group">
              <div>
                <Link
                  href={item.to}
                  className={`flex items-center py-2 px-2 rounded-lg transition-all duration-200 text-white ${
                    isActive(item.to) ? 'font-bold' : ''
                  } ${collapsed ? 'justify-center' : ''}`}
                  style={{
                    backgroundColor: isActive(item.to) ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                    color: '#FFFFFF'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive(item.to)) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive(item.to)) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                  onClick={(e) => {
                    if (item.subItems.length > 0) {
                      e.preventDefault();
                      toggleMenu(item.label);
                    }
                  }}
                >
                  <span className="text-lg">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="ml-3 text-base">{item.label}</span>
                      {item.subItems.length > 0 && (
                        <span className="ml-auto">
                          {expandedMenu === item.label ? <FaChevronLeft size={14} /> : <FaChevronRight size={14} />}
                        </span>
                      )}
                    </>
                  )}
                  {collapsed && (
                    <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 text-white text-xs rounded px-2 py-1 shadow-lg z-50 whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ backgroundColor: '#0A1929', border: '1px solid #1A1A1A' }}>
                      {item.label}
                    </span>
                  )}
                </Link>
                {!collapsed && item.subItems.length > 0 && expandedMenu === item.label && (
                  <ul className="ml-4 mt-1 space-y-1">
                    {item.subItems.map((subItem) => (
                      <li key={subItem.label}>
                        <Link
                          href={subItem.to}
                          className={`flex items-center py-2 px-2 rounded-lg transition-all duration-200 text-white ${
                            isActive(subItem.to) ? 'font-bold' : ''
                          }`}
                          style={{
                            backgroundColor: isActive(subItem.to) ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                            color: '#FFFFFF'
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive(subItem.to)) {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive(subItem.to)) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                          onClick={() => {
                            if (isMobile && setMobileOpen) {
                              setMobileOpen(false);
                            }
                          }}
                        >
                          <span className="text-lg">{subItem.icon}</span>
                          <span className="ml-3 text-base">{subItem.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar; 