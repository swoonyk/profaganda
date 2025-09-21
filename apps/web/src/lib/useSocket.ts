"use client";
import { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function useSocket(): Socket | null {
  const [isClient, setIsClient] = useState(false);
  
  const url = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:4000';

  useEffect(() => {
    setIsClient(true);
  }, []);

  const client = useMemo(() => {
    if (!isClient) {
      return null;
    }
    
    if (!socket) {
      // Determine if we should use secure connection based on URL or current page protocol
      const isSecure = url.startsWith('https://') || url.startsWith('wss://') || 
                      (typeof window !== 'undefined' && window.location.protocol === 'https:');
      
      socket = io(url, {
        transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
        secure: isSecure, // Auto-detect secure connection based on URL or page protocol
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true
      });

      // Debug logging
      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        console.log('Connection URL:', url);
        console.log('Transport:', socket?.io.engine.transport.name);
      });
    }
    return socket;
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
    };

    client.on('connect', onConnect);
    client.on('disconnect', onDisconnect);

    return () => {
      client.off('connect', onConnect);
      client.off('disconnect', onDisconnect);
    };
  }, [client]);

  return client;
}