"use client";
import React, { useEffect, useState } from 'react';
import { useSocket } from '../src/lib/useSocket';

export default function SocketTest() {
  const socket: any = useSocket();
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    if (!socket) return;
    const push = (m: string) => setEvents(e => [m, ...e].slice(0, 50));

    const onConnect = () => push(`connected:${socket.id}`);
    const onConnected = (m: any) => push(`server:connected ${JSON.stringify(m)}`);
    const onRoundStarted = (m: any) => push(`round_started ${JSON.stringify(m)}`);
    const onRoundResults = (m: any) => push(`round_results ${JSON.stringify(m)}`);

    socket.on('connect', onConnect);
    socket.on('connected', onConnected);
    socket.on('server:round_started', onRoundStarted);
    socket.on('server:round_results', onRoundResults);

    const join = () => {
      const playerId = `test-next-${Math.random().toString(36).slice(2,8)}`;
      socket.emit('connect_player', { playerId, partyId: 'party-1', isHost: false });
      push(`emitted connect_player as ${playerId}`);
    };

    socket.on('connect', join);

    return () => {
      socket.off('connect', onConnect);
      socket.off('connected', onConnected);
      socket.off('server:round_started', onRoundStarted);
      socket.off('server:round_results', onRoundResults);
      socket.off('connect', join);
    };
  }, [socket]);

  const submitAI = () => {
    socket.emit('player:submit_answer', { roundId: 'r1', choice: { isAI: true } });
    setEvents(e => [`emitted answer ai`, ...e].slice(0,50));
  };

  const startRoundAsHost = async () => {
    try {
      const { io } = await import('socket.io-client');
      const url = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:4000';
      const isSecure = url.startsWith('https://') || url.startsWith('wss://') || 
                      (typeof window !== 'undefined' && window.location.protocol === 'https:');
      const host = io(url, { 
        transports: ['websocket'],
        secure: isSecure
      });
      host.on('connect', () => {
        host.emit('connect_player', { playerId: 'host-next', partyId: 'party-1', isHost: true });
        host.emit('host:start_round', { roundId: 'r1', mode: 'B', correctAnswer: true, partyId: 'party-1' });
        setEvents(ev => ['Host started round r1', ...ev].slice(0,50));
      });
    } catch (err: any) {
      setEvents(e => [`host start failed: ${err?.message ?? err}`, ...e].slice(0,50));
    }
  };

  const fetchProfessors = async () => {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiBaseUrl) {
        setEvents(e => [`fetch error: NEXT_PUBLIC_API_URL not set`, ...e].slice(0,50));
        return;
      }
      const res = await fetch(`${apiBaseUrl}/professors`);
      if (!res.ok) {
        setEvents(e => [`fetch error: ${res.status} ${res.statusText}`, ...e].slice(0,50));
        return;
      }
      const json = await res.json();
      setEvents(e => [`/professors returned ${json.professors?.length ?? 0} items`, ...e].slice(0,50));
    } catch (err: any) {
      setEvents(e => [`fetch error: ${err.message}`, ...e].slice(0,50));
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Socket Test</h1>
      <p>Socket ID: {socket?.id ?? 'not connected yet'}</p>
      <div style={{ marginBottom: 8 }}>
        <button onClick={submitAI}>Submit AI Answer (round r1)</button>
        <button onClick={startRoundAsHost} style={{ marginLeft:8 }}>Start Round as Host</button>
        <button onClick={fetchProfessors} style={{ marginLeft:8 }}>Fetch /professors</button>
      </div>
      <ul>
        {events.map((ev, i) => <li key={i}><code>{ev}</code></li>)}
      </ul>
    </div>
  );
}
