'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Upload,
  History,
  ShieldCheck,
  User,
  LogOut,
  Zap,
  ChevronLeft,
  Menu,
  FileSearch,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard',         icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/upload',            icon: Upload,          label: 'Upload Document' },
  { href: '/history',           icon: History,         label: 'My History' },
  { href: '/audit',             icon: ShieldCheck,     label: 'Audit Trail' },
  { href: '/profile',           icon: User,            label: 'Profile' },
];

const FUTURE_ITEMS = [
  { href: '/sop-intelligence',  icon: Sparkles,        label: 'SOPintelligence', badge: 'Soon' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen bg-white border-r border-slate-200 transition-all duration-300 ease-in-out shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100">
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 leading-tight truncate">
                RegCompCopilot
              </p>
              <p className="text-xs text-slate-400 leading-tight">AI-Powered Analysis</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm mx-auto">
            <Zap className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors',
            collapsed && 'absolute -right-3 top-5 bg-white border border-slate-200 shadow-sm rounded-full w-6 h-6 flex items-center justify-center p-0'
          )}
        >
          {collapsed ? <Menu className="w-3 h-3" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Navigation
          </p>
        )}
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                collapsed && 'justify-center px-0'
              )}
            >
              <Icon
                className={cn(
                  'flex-shrink-0',
                  collapsed ? 'w-5 h-5' : 'w-4.5 h-4.5',
                  isActive ? 'text-indigo-600' : 'text-slate-400'
                )}
                size={18}
              />
              {!collapsed && <span className="truncate">{label}</span>}
              {!collapsed && isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 flex-shrink-0" />
              )}
            </Link>
          );
        })}

        {/* Future features section */}
        <div className={cn('pt-3 mt-2 border-t border-slate-100')}>
          {!collapsed && (
            <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Coming Soon
            </p>
          )}
          {FUTURE_ITEMS.map(({ href, icon: Icon, label, badge }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-slate-500 hover:bg-violet-50 hover:text-violet-700',
                  collapsed && 'justify-center px-0'
                )}
              >
                <Icon
                  className={cn(
                    'flex-shrink-0',
                    collapsed ? 'w-5 h-5' : 'w-4.5 h-4.5',
                    isActive ? 'text-violet-600' : 'text-slate-400'
                  )}
                  size={18}
                />
                {!collapsed && <span className="truncate">{label}</span>}
                {!collapsed && (
                  <span className="ml-auto text-[10px] font-bold text-violet-500 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User section */}
      <div className={cn('border-t border-slate-100 p-3', collapsed && 'flex flex-col items-center')}>
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2.5 mb-2 px-1">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-700 text-xs font-bold">{user?.avatar || user?.name?.[0]?.toUpperCase() || 'U'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate leading-tight">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-slate-400 truncate leading-tight">{user?.email || ''}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </>
        ) : (
          <button
            onClick={logout}
            title="Sign Out"
            className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
