"use client";
import { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function useSocket(): Socket | null {
  const [isClient, setIsClient] = useState(false);
  
  const url = 'https://socket.hodgman.net'; // Use environment variable or default URL

  useEffect(() => {
    setIsClient(true);
  }, []);

  const client = useMemo(() => {
    if (!isClient) {
      return null;
    }
    
    if (!socket && url) {
      // Determine if we should use secure connection based on URL or current page protocol
      const isSecure = url.startsWith('https://') || url.startsWith('wss://') || 
                      (typeof window !== 'undefined' && window.location.protocol === 'https:');
      
      socket = io(url, {
        transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
        secure: isSecure, // Auto-detect secure connection based on URL or page protocol
        rejectUnauthorized: false, // Allow self-signed certificates
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true,
        withCredentials: false
      });

      // Enhanced debug logging
      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        console.log('Connection details:', {
          url,
          transport: socket?.io.engine.transport.name,
          secure: isSecure,
          protocol: typeof window !== 'undefined' ? window.location.protocol : 'unknown',
          error: error.message
        });

        // Attempt reconnection with polling if WebSocket fails
        if (socket?.io.engine.transport.name === 'websocket') {
          console.log('Retrying with polling transport...');
          socket.io.opts.transports = ['polling'];
        }
      });

      socket.io.on('error', (error) => {
        console.error('Transport error:', error);
      });

      socket.io.on('reconnect_attempt', (attempt) => {
        console.log(`Reconnection attempt ${attempt}`);
      });
    }
    return url ? socket : null;
  }, [isClient, url]);
  useEffect(() => {
    if (!client) return;
    
    const onConnect = () => {
      console.log('Socket connected successfully', {
        id: client.id,
        transport: client.io.engine.transport.name
      });
    };
    
    const onDisconnect = (reason: string) => {
      console.log('Socket disconnected:', reason);
      console.trace('Socket disconnect stack trace');
    };

    client.on('connect', onConnect);
    client.on('disconnect', onDisconnect);

    return () => {
      client.off('connect', onConnect);
      client.off('disconnect', onDisconnect);
      
      // Don't disconnect socket on component unmount - keep connection alive
      // Socket will be reused across components
    };
  }, [client]);

  return client;
}