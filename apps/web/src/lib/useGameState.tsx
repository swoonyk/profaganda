import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useSocket } from './useSocket';

export interface GameState {
  phase: 'home' | 'lobby' | 'round' | 'leaderboard' | 'end';
  players: Array<{
    name: string;
    points: number;
    yourself?: boolean;
    isHost?: boolean;
  }>;
  roundNumber: number;
  options?: string[];
  roundId?: string;
  partyId?: string;
}

export function useGameState() {
  const socket = useSocket();
  const [gameState, setGameState] = useState<GameState>({
    phase: 'home',
    players: [],
    roundNumber: 1
  });

  useEffect(() => {
    if (!socket) return;

    // Listen for game state updates
    socket.on('server:players_update', ({ players }) => {
      setGameState(prev => ({ ...prev, players }));
    });

    socket.on('server:phase_change', ({ phase }) => {
      setGameState(prev => ({ ...prev, phase }));
    });

    socket.on('server:round_started', ({ roundId, options }) => {
      setGameState(prev => ({
        ...prev,
        phase: 'round',
        roundId,
        options
      }));
    });

    socket.on('server:round_results', ({ players, roundNumber }) => {
      setGameState(prev => ({
        ...prev,
        phase: 'leaderboard',
        players,
        roundNumber
      }));
    });

    return () => {
      socket.off('server:players_update');
      socket.off('server:phase_change');
      socket.off('server:round_started');
      socket.off('server:round_results');
    };
  }, [socket]);

  return gameState;
}