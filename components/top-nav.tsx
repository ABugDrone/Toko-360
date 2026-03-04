'use client';

import { useAuth } from '@/app/auth-context';
import { Bell, HelpCircle, Search } from 'lucide-react';
import Image from 'next/image';

interface TopNavProps {
  title?: string;
  searchPlaceholder?: string;
}

export function TopNav({ title = 'Staff Portal', searchPlaceholder = 'Search reports...' }: TopNavProps) {
  const { user } = useAuth();

  return (
    <header className="border-b sticky top-0 z-40 transition-colors duration-300" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Title */}
        <div>
          <h1 className="text-xl font-bold transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>{title}</h1>
        </div>

        {/* Center: Search (optional) */}
        <div className="flex-1 max-w-xs mx-8 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.5 }} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm transition-colors duration-300 focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: 'var(--theme-background)', 
                borderColor: 'var(--theme-border)', 
                color: 'var(--theme-text)',
              }}
            />
          </div>
        </div>

        {/* Right: Actions and User */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg transition-all duration-300 hover:scale-105" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--theme-accent)' }}></span>
          </button>

          {/* Help */}
          <button className="p-2 rounded-lg transition-all duration-300 hover:scale-105" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* User Avatar */}
          {user && (
            <div className="flex items-center gap-3 pl-4 border-l transition-colors duration-300" style={{ borderColor: 'var(--theme-border)' }}>
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>{user.name}</div>
                <div className="text-xs uppercase transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.6 }}>{user.role.replace('_', ' ')}</div>
              </div>
              {/* Profile Image */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.split(' ').map(n => n[0]).join('')
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
