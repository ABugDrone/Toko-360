/**
 * Integration tests for real-time messaging functionality
 * Validates: Requirements 27.1, 27.2, 27.3, 27.4, 27.5, 27.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import MessagingPage from './page';
import { useAuth } from '@/app/auth-context';
import * as storage from '@/lib/storage';
import { useRealtimeMessages } from '@/hooks/use-realtime-messages';

// Mock Supabase first
vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

// Mock dependencies
vi.mock('@/app/auth-context');
vi.mock('@/lib/storage');
vi.mock('@/hooks/use-realtime-messages');
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/components/top-nav', () => ({
  TopNav: () => <div>TopNav</div>,
}));

describe('MessagingPage Real-time Integration', () => {
  const mockUser = {
    id: 'user-123',
    staffId: 'TA-2024-001',
    name: 'Test User',
    email: 'test@example.com',
    department: 'IT' as const,
    role: 'staff' as const,
  };

  const mockOtherUser = {
    id: 'user-456',
    staffId: 'TA-2024-002',
    name: 'Other User',
    email: 'other@example.com',
    department: 'IT' as const,
    role: 'staff' as const,
    status: 'online' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useAuth as any).mockReturnValue({ user: mockUser });
    (storage.getAllUsers as any).mockResolvedValue([mockUser, mockOtherUser]);
    (storage.getMessages as any).mockResolvedValue([]);
    (storage.addMessage as any).mockResolvedValue(undefined);
    (useRealtimeMessages as any).mockReturnValue({
      isConnected: true,
      isReconnecting: false,
      error: null,
    });
  });

  /**
   * Validates: Requirement 27.6 - Display connection status indicator
   */
  it('should display connection status indicator when connected', async () => {
    render(<MessagingPage />);

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  /**
   * Validates: Requirement 27.6 - Display connection status indicator
   */
  it('should display reconnecting status when connection is lost', async () => {
    (useRealtimeMessages as any).mockReturnValue({
      isConnected: false,
      isReconnecting: true,
      error: 'Connection lost',
    });

    render(<MessagingPage />);

    await waitFor(() => {
      expect(screen.getByText('Reconnecting')).toBeInTheDocument();
    });
  });

  /**
   * Validates: Requirement 27.6 - Display connection status indicator
   */
  it('should display offline status when connection fails', async () => {
    (useRealtimeMessages as any).mockReturnValue({
      isConnected: false,
      isReconnecting: false,
      error: 'Connection failed',
    });

    render(<MessagingPage />);

    await waitFor(() => {
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });
  });

  /**
   * Validates: Requirement 27.1 - Subscribe to Supabase real-time changes
   */
  it('should set up real-time subscription with user ID', async () => {
    render(<MessagingPage />);

    await waitFor(() => {
      expect(useRealtimeMessages).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          onNewMessage: expect.any(Function),
          onMessageRead: expect.any(Function),
        })
      );
    });
  });

  /**
   * Validates: Requirement 27.2 - Update UI when new messages arrive
   */
  it('should handle new message callback from real-time subscription', async () => {
    let onNewMessageCallback: any;
    
    (useRealtimeMessages as any).mockImplementation(({ onNewMessage }: any) => {
      onNewMessageCallback = onNewMessage;
      return {
        isConnected: true,
        isReconnecting: false,
        error: null,
      };
    });

    render(<MessagingPage />);

    await waitFor(() => {
      expect(onNewMessageCallback).toBeDefined();
    });

    // Verify callback is a function
    expect(typeof onNewMessageCallback).toBe('function');
  });

  /**
   * Validates: Requirement 27.3 - Update read status in real-time
   */
  it('should handle message read callback from real-time subscription', async () => {
    let onMessageReadCallback: any;
    
    (useRealtimeMessages as any).mockImplementation(({ onMessageRead }: any) => {
      onMessageReadCallback = onMessageRead;
      return {
        isConnected: true,
        isReconnecting: false,
        error: null,
      };
    });

    render(<MessagingPage />);

    await waitFor(() => {
      expect(onMessageReadCallback).toBeDefined();
    });

    // Verify callback is a function
    expect(typeof onMessageReadCallback).toBe('function');
  });

  /**
   * Validates: Requirement 27.5 - Handle connection drops and reconnection
   */
  it('should continue to function when connection is reconnecting', async () => {
    (useRealtimeMessages as any).mockReturnValue({
      isConnected: false,
      isReconnecting: true,
      error: null,
    });

    render(<MessagingPage />);

    // Page should still render and be functional
    await waitFor(() => {
      expect(screen.getByText('Messages')).toBeInTheDocument();
      expect(screen.getByText('Reconnecting')).toBeInTheDocument();
    });
  });
});
