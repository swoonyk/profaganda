"use client";
import { useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function useSocket(): Socket {
  // Ensure this hook only runs in the browser
  if (typeof window === 'undefined') {
    // Return a stub object that won't be used on the server
    // @ts-ignore
    return {} as Socket;
  }

  const url = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:4000';

  const client = useMemo(() => {
    if (!socket) {
      socket = io(url, { transports: ['websocket'] });
    }
    return socket as Socket;
  }, [url]);

  useEffect(() => {
    const onConnect = () => console.log('Socket connected', client.id);
    client.on('connect', onConnect);
    return () => {
      client.off('connect', onConnect);
    };
  }, [client]);

  return client;
}
