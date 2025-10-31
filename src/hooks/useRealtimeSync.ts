import { useEffect, useState, useCallback, useRef } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface RealtimeSyncConfig<T> {
  table: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  onInsert?: (payload: T) => void;
  onUpdate?: (payload: T) => void;
  onDelete?: (payload: { old: T }) => void;
  enabled?: boolean;
}

export interface RealtimeSyncReturn<T> {
  data: T[];
  isConnected: boolean;
  error: Error | null;
  reconnect: () => void;
}

export function useRealtimeSync<T = any>(
  config: RealtimeSyncConfig<T>
): RealtimeSyncReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const { table, filter, event = '*', onInsert, onUpdate, onDelete, enabled = true } = config;

  const handleInsert = useCallback(
    (payload: RealtimePostgresChangesPayload<T>) => {
      if (payload.new) {
        setData((prev) => [...prev, payload.new as T]);
        onInsert?.(payload.new as T);
      }
    },
    [onInsert]
  );

  const handleUpdate = useCallback(
    (payload: RealtimePostgresChangesPayload<T>) => {
      if (payload.new) {
        setData((prev) =>
          prev.map((item: any) =>
            item.id === (payload.new as any).id ? (payload.new as T) : item
          )
        );
        onUpdate?.(payload.new as T);
      }
    },
    [onUpdate]
  );

  const handleDelete = useCallback(
    (payload: RealtimePostgresChangesPayload<T>) => {
      if (payload.old) {
        setData((prev) =>
          prev.filter((item: any) => item.id !== (payload.old as any).id)
        );
        onDelete?.({ old: payload.old as T });
      }
    },
    [onDelete]
  );

  const setupChannel = useCallback(() => {
    if (!enabled) return;

    try {
      // Clean up existing channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      // Create new channel
      const channelName = `realtime:${table}${filter ? `:${filter}` : ''}`;
      const channel = supabase.channel(channelName);

      // Subscribe to postgres changes
      let subscription = channel.on(
        'postgres_changes',
        {
          event: event,
          schema: 'public',
          table: table,
          filter: filter,
        } as any,
        (payload: RealtimePostgresChangesPayload<T>) => {
          console.log(`[Realtime] ${payload.eventType} on ${table}:`, payload);

          switch (payload.eventType) {
            case 'INSERT':
              handleInsert(payload);
              break;
            case 'UPDATE':
              handleUpdate(payload);
              break;
            case 'DELETE':
              handleDelete(payload);
              break;
          }
        }
      );

      // Subscribe and handle connection status
      subscription.subscribe((status) => {
        console.log(`[Realtime] Channel ${channelName} status:`, status);
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false);
          setError(new Error(`Connection ${status}`));
          
          // Attempt reconnection after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`[Realtime] Attempting to reconnect to ${channelName}...`);
            setupChannel();
          }, 3000);
        } else if (status === 'CLOSED') {
          setIsConnected(false);
        }
      });

      channelRef.current = channel;
    } catch (err) {
      console.error('[Realtime] Setup error:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setIsConnected(false);
    }
  }, [enabled, table, filter, event, handleInsert, handleUpdate, handleDelete]);

  const reconnect = useCallback(() => {
    console.log('[Realtime] Manual reconnect triggered');
    setupChannel();
  }, [setupChannel]);

  useEffect(() => {
    setupChannel();

    return () => {
      // Cleanup on unmount
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (channelRef.current) {
        console.log('[Realtime] Cleaning up channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [setupChannel]);

  return {
    data,
    isConnected,
    error,
    reconnect,
  };
}
