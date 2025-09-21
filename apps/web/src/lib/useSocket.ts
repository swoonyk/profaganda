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
      socket = io(url, { transports: ['websocket'] });
    }
    return socket;
  }, [isClient, url]);

  useEffect(() => {
    if (!client) return;
    
    const onConnect = () => console.log('Socket connected', client.id);
    client.on('connect', onConnect);
    return () => {
      client.off('connect', onConnect);
    };
  }, [client]);

  return client;
}
