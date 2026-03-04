'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/auth-context';
import { LayoutGrid, Clock, FileText, MessageSquare, Settings, LogOut, Zap, CheckSquare, Building2, Calendar, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';
import { useState } from 'react';

interface SidebarItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  roles?: string[];
  badge?: number;
  subItems?: { label: string; href: string }[];
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);

  const toggleDropdown = (label: string) => {
    setOpenDropdowns(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const sidebarItems: SidebarItem[] = [
    ...(user?.role === 'admin'
      ? [
          {
            label: 'Dashboard',
            icon: <LayoutGrid className="w-5 h-5" />,
            subItems: [
              { label: 'Staff Dashboard', href: '/dashboard' },
              { label: 'Admin Dashboard', href: '/admin/dashboard' },
            ],
          },
        ]
      : [
          {
            label: 'Dashboard',
            href: '/dashboard',
            icon: <LayoutGrid className="w-5 h-5" />,
          },
        ]),
    ...(user?.role === 'admin'
      ? [
          {
            label: 'Attendance',
            icon: <Clock className="w-5 h-5" />,
            subItems: [
              { label: 'My Attendance', href: '/attendance' },
              { label: 'Attendance Approvals', href: '/admin/approvals/attendance' },
            ],
          },
        ]
      : [
          {
            label: 'Attendance',
            href: '/attendance',
            icon: <Clock className="w-5 h-5" />,
          },
        ]),
    ...(user?.role === 'admin'
      ? [
          {
            label: 'Internal Reports',
            icon: <FileText className="w-5 h-5" />,
            subItems: [
              { label: 'My Reports', href: '/reports' },
              { label: 'Report Approvals', href: '/admin/approvals/reports' },
            ],
          },
        ]
      : [
          {
            label: 'Internal Reports',
            href: '/reports',
            icon: <FileText className="w-5 h-5" />,
          },
        ]),
    {
      label: 'Events',
      href: '/events',
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      label: 'Messaging',
      href: '/messaging',
      icon: <MessageSquare className="w-5 h-5" />,
      badge: 0,
    },
    ...(user?.role === 'admin'
      ? [
          {
            label: 'Settings',
            icon: <Settings className="w-5 h-5" />,
            subItems: [
              { label: 'Staff Settings', href: '/settings' },
              { label: 'System Config', href: '/admin/config' },
            ],
          },
        ]
      : [
          {
            label: 'Staff Settings',
            href: '/settings',
            icon: <Settings className="w-5 h-5" />,
          },
        ]),
    ...(user?.role === 'admin'
      ? [
          {
            label: 'Management',
            icon: <Users className="w-5 h-5" />,
            subItems: [
              { label: 'Departments', href: '/admin/departments' },
              { label: 'User Management', href: '/admin/config' },
            ],
          },
        ]
      : []),
  ];

  return (
    <aside className="w-64 border-r flex flex-col h-screen backdrop-blur-sm transition-all duration-300" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
      {/* Logo */}
      <div className="p-4 border-b rounded-b-lg mx-4 mt-4 mb-2" style={{ borderColor: 'var(--theme-border)' }}>
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300" style={{ backgroundColor: 'var(--theme-accent)' }}>
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
            </svg>
          </div>
          <div>
            <div className="font-bold text-sm" style={{ color: 'var(--theme-text)' }}>Toko 360</div>
            <div className="text-xs" style={{ color: 'var(--theme-accent)' }}>STAFF PORTAL</div>
          </div>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {sidebarItems.map((item) => {
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isDropdownOpen = openDropdowns.includes(item.label);
          const isActive = item.href ? (pathname === item.href || pathname.startsWith(item.href + '/')) : false;
          const hasActiveSubItem = hasSubItems && item.subItems.some(sub => pathname === sub.href || pathname.startsWith(sub.href + '/'));

          if (hasSubItems) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleDropdown(item.label)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group',
                    hasActiveSubItem
                      ? 'font-semibold border'
                      : 'hover:border border-transparent'
                  )}
                  style={{
                    backgroundColor: hasActiveSubItem ? 'var(--theme-accent)' : 'transparent',
                    color: hasActiveSubItem ? '#ffffff' : 'var(--theme-text)',
                    borderColor: hasActiveSubItem ? 'var(--theme-accent)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!hasActiveSubItem) {
                      e.currentTarget.style.backgroundColor = 'var(--theme-surface)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!hasActiveSubItem) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span>{item.icon}</span>
                  <span className="font-medium text-sm flex-1 text-left">{item.label}</span>
                  {isDropdownOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                
                {isDropdownOpen && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.subItems.map((subItem) => {
                      const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/');
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            'flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm',
                            isSubActive
                              ? 'font-semibold'
                              : 'hover:border border-transparent'
                          )}
                          style={{
                            backgroundColor: isSubActive ? 'var(--theme-background)' : 'transparent',
                            color: isSubActive ? 'var(--theme-accent)' : 'var(--theme-text)',
                            opacity: isSubActive ? 1 : 0.8,
                          }}
                          onMouseEnter={(e) => {
                            if (!isSubActive) {
                              e.currentTarget.style.backgroundColor = 'var(--theme-background)';
                              e.currentTarget.style.opacity = '1';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSubActive) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.opacity = '0.8';
                            }
                          }}
                        >
                          {subItem.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'font-semibold border'
                  : 'hover:border border-transparent'
              )}
              style={{
                backgroundColor: isActive ? 'var(--theme-accent)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--theme-text)',
                borderColor: isActive ? 'var(--theme-accent)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--theme-surface)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span className={cn(isActive && 'text-cyan-400')}>
                {item.icon}
              </span>
              <span className="font-medium text-sm">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto bg-cyan-500 text-slate-950 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile and Logout */}
      <div className="p-4 border-t space-y-3" style={{ borderColor: 'var(--theme-border)' }}>
        {/* Theme Toggle */}
        <div className="flex justify-center mb-2">
          <ThemeToggle />
        </div>
        
        {user && (
          <div className="px-4 py-3 rounded-lg border flex items-center gap-3" style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)' }}>
            {/* Profile Image */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.split(' ').map(n => n[0]).join('')
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs mb-1" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>Logged in as</div>
              <div className="font-semibold text-sm truncate" style={{ color: 'var(--theme-text)' }}>{user.name}</div>
              <div className="text-xs" style={{ color: 'var(--theme-accent)' }}>{user.role.replace('_', ' ').toUpperCase()}</div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 group font-medium text-sm hover:border"
          style={{ color: 'var(--theme-text)', borderColor: 'transparent' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--theme-surface)';
            e.currentTarget.style.color = 'var(--theme-accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--theme-text)';
          }}
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
