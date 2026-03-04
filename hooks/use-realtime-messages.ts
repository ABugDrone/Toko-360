import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Message } from '@/lib/types';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeMessagesOptions {
  userId: string | undefined;
  onNewMessage?: (message: Message) => void;
  onMessageRead?: (messageId: string) => void;
}

interface ConnectionStatus {
  isConnected: boolean;
  isReconnecting: boolean;
  error: string | null;
}

/**
 * Custom hook for real-time message updates via Supabase
 * Requirement 27.1, 27.2, 27.3, 27.4, 27.5, 27.6
 */
export function useRealtimeMessages({
  userId,
  onNewMessage,
  onMessageRead,
}: UseRealtimeMessagesOptions) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isReconnecting: false,
    error: null,
  });

  // Use refs to store callbacks to avoid recreating them on every render
  const onNewMessageRef = useRef(onNewMessage);
  const onMessageReadRef = useRef(onMessageRead);

  // Update refs when callbacks change
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  useEffect(() => {
    onMessageReadRef.current = onMessageRead;
  }, [onMessageRead]);

  const handleInsert = useCallback((payload: any) => {
    const newMessage = payload.new as Message;
    // Only notify if the message is for the current user
    if (newMessage.recipientId === userId || newMessage.senderId === userId) {
      onNewMessageRef.current?.(newMessage);
    }
  }, [userId]);

  const handleUpdate = useCallback((payload: any) => {
    const updatedMessage = payload.new as Message;
    // Check if read status changed
    if (updatedMessage.read && (updatedMessage.recipientId === userId || updatedMessage.senderId === userId)) {
      onMessageReadRef.current?.(updatedMessage.id);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let channel: RealtimeChannel | null = null;

    const setupSubscription = () => {
      setConnectionStatus({
        isConnected: false,
        isReconnecting: false,
        error: null,
      });

      // Subscribe to messages table changes filtered by user
      channel = supabase
        .channel('messages-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `or(sender_id.eq.${userId},recipient_id.eq.${userId})`,
          },
          handleInsert
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `or(sender_id.eq.${userId},recipient_id.eq.${userId})`,
          },
          handleUpdate
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setConnectionStatus({
              isConnected: true,
              isReconnecting: false,
              error: null,
            });
          } else if (status === 'CHANNEL_ERROR') {
            setConnectionStatus({
              isConnected: false,
              isReconnecting: false,
              error: 'Failed to connect to real-time updates',
            });
          } else if (status === 'TIMED_OUT') {
            setConnectionStatus({
              isConnected: false,
              isReconnecting: true,
              error: 'Connection timed out, reconnecting...',
            });
          } else if (status === 'CLOSED') {
            setConnectionStatus({
              isConnected: false,
              isReconnecting: true,
              error: 'Connection closed, reconnecting...',
            });
          }
        });
    };

    setupSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, handleInsert, handleUpdate]);

  return connectionStatus;
}
