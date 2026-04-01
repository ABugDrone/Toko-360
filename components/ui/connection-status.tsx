'use client';

/**
 * Connection Status Indicator Component
 * Displays real-time connection status to the database
 * Requirements: 25.1, 27.6
 */

import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './badge';

export type ConnectionStatus = 'online' | 'offline' | 'reconnecting';

interface ConnectionStatusProps {
  status?: ConnectionStatus;
  className?: string;
  showLabel?: boolean;
}

/**
 * Connection Status Indicator
 * Displays current connection state with icon and optional label
 */
export function ConnectionStatus({
  status: externalStatus,
  className,
  showLabel = true,
}: ConnectionStatusProps) {
  const [status, setStatus] = useState<ConnectionStatus>('online');

  // Use external status if provided, otherwise monitor browser online status
  useEffect(() => {
    if (externalStatus) {
      setStatus(externalStatus);
      return;
    }

    const handleOnline = () => setStatus('online');
    const handleOffline = () => setStatus('offline');

    // Set initial status
    setStatus(navigator.onLine ? 'online' : 'offline');

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [externalStatus]);

  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          icon: Wifi,
          label: 'Connected',
          variant: 'default' as const,
          className: 'bg-green-500/10 text-green-500 border-green-500/20',
        };
      case 'offline':
        return {
          icon: WifiOff,
          label: 'Offline',
          variant: 'destructive' as const,
          className: 'bg-red-500/10 text-red-500 border-red-500/20',
        };
      case 'reconnecting':
        return {
          icon: RefreshCw,
          label: 'Reconnecting',
          variant: 'secondary' as const,
          className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'flex items-center gap-1.5 px-2 py-1',
        config.className,
        className
      )}
    >
      <Icon
        className={cn(
          'h-3 w-3',
          status === 'reconnecting' && 'animate-spin'
        )}
      />
      {showLabel && <span className="text-xs font-medium">{config.label}</span>}
    </Badge>
  );
}

/**
 * Hook to manage connection status
 * Can be used to track database connection state
 */
export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('online');
  const [lastError, setLastError] = useState<Error | null>(null);

  const setOnline = () => {
    setStatus('online');
    setLastError(null);
  };

  const setOffline = (error?: Error) => {
    setStatus('offline');
    if (error) setLastError(error);
  };

  const setReconnecting = () => {
    setStatus('reconnecting');
  };

  return {
    status,
    lastError,
    setOnline,
    setOffline,
    setReconnecting,
  };
}
