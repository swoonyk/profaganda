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
      socket = io(url, {
        transports: ['websocket'],
        secure: true, // Enable for HTTPS
        rejectUnauthorized: false, // Required for self-signed certificates
        reconnection: true, // Enable auto-reconnection
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    }
    return socket;
  }, [isClient, url]);

  useEffect(() => {
    if (!client) return;
    
    const onConnect = () => console.log('Socket connected', client.id);
    const onDisconnect = () => console.log('Socket disconnected');
    const onError = (error: Error) => console.error('Socket error:', error);

    client.on('connect', onConnect);
    client.on('disconnect', onDisconnect);
    client.on('connect_error', onError);

    return () => {
      client.off('connect', onConnect);
      client.off('disconnect', onDisconnect);
      client.off('connect_error', onError);
    };
  }, [client]);

  return client;
}