import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Event } from '@/lib/types';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeEventsOptions {
  department: string | undefined;
  onEventCreated?: (event: Event) => void;
  onEventUpdated?: (event: Event) => void;
  onEventDeleted?: (eventId: string) => void;
}

interface ConnectionStatus {
  isConnected: boolean;
  isReconnecting: boolean;
  error: string | null;
}

/**
 * Custom hook for real-time event updates via Supabase
 * Listens for INSERT, UPDATE, and DELETE operations on events table
 */
export function useRealtimeEvents({
  department,
  onEventCreated,
  onEventUpdated,
  onEventDeleted,
}: UseRealtimeEventsOptions) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isReconnecting: false,
    error: null,
  });

  // Use refs to store callbacks to avoid recreating them on every render
  const onEventCreatedRef = useRef(onEventCreated);
  const onEventUpdatedRef = useRef(onEventUpdated);
  const onEventDeletedRef = useRef(onEventDeleted);

  // Update refs when callbacks change
  useEffect(() => {
    onEventCreatedRef.current = onEventCreated;
  }, [onEventCreated]);

  useEffect(() => {
    onEventUpdatedRef.current = onEventUpdated;
  }, [onEventUpdated]);

  useEffect(() => {
    onEventDeletedRef.current = onEventDeleted;
  }, [onEventDeleted]);

  const handleInsert = useCallback((payload: any) => {
    const newEvent = payload.new;
    // Check if event is for this department (null means all departments)
    if (!department) return;
    
    const targetDepts = newEvent.target_departments;
    const isForDepartment = targetDepts === null || targetDepts.includes(department);
    
    if (isForDepartment) {
      // Transform database format to app format
      const event: Event = {
        id: newEvent.id,
        title: newEvent.title,
        description: newEvent.description,
        eventDate: newEvent.event_date,
        eventTime: newEvent.event_time,
        location: newEvent.location,
        createdBy: newEvent.created_by,
        category: newEvent.category,
        color: newEvent.color,
        targetDepartments: newEvent.target_departments,
        createdAt: new Date(newEvent.created_at).getTime(),
        updatedAt: newEvent.updated_at ? new Date(newEvent.updated_at).getTime() : undefined,
      };
      onEventCreatedRef.current?.(event);
    }
  }, [department]);

  const handleUpdate = useCallback((payload: any) => {
    const updatedEvent = payload.new;
    // Check if event is for this department
    if (!department) return;
    
    const targetDepts = updatedEvent.target_departments;
    const isForDepartment = targetDepts === null || targetDepts.includes(department);
    
    if (isForDepartment) {
      // Transform database format to app format
      const event: Event = {
        id: updatedEvent.id,
        title: updatedEvent.title,
        description: updatedEvent.description,
        eventDate: updatedEvent.event_date,
        eventTime: updatedEvent.event_time,
        location: updatedEvent.location,
        createdBy: updatedEvent.created_by,
        category: updatedEvent.category,
        color: updatedEvent.color,
        targetDepartments: updatedEvent.target_departments,
        createdAt: new Date(updatedEvent.created_at).getTime(),
        updatedAt: updatedEvent.updated_at ? new Date(updatedEvent.updated_at).getTime() : undefined,
      };
      onEventUpdatedRef.current?.(event);
    }
  }, [department]);

  const handleDelete = useCallback((payload: any) => {
    const deletedEvent = payload.old;
    onEventDeletedRef.current?.(deletedEvent.id);
  }, []);

  useEffect(() => {
    if (!department) {
      return;
    }

    let channel: RealtimeChannel | null = null;

    const setupSubscription = () => {
      setConnectionStatus({
        isConnected: false,
        isReconnecting: false,
        error: null,
      });

      // Subscribe to events table changes
      channel = supabase
        .channel('events-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'events',
          },
          handleInsert
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'events',
          },
          handleUpdate
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'events',
          },
          handleDelete
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
  }, [department, handleInsert, handleUpdate, handleDelete]);

  return connectionStatus;
}
