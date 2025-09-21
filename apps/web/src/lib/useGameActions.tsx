import { useCallback } from 'react';
import { useSocket } from './useSocket';

export function useGameActions() {
  const socket = useSocket();

  const joinGame = useCallback((name: string, isHost: boolean, code?: string) => {
    const playerId = `player-${Math.random().toString(36).slice(2, 8)}`;
    socket.emit('connect_player', {
      playerId,
      partyId: code || 'new-party',
      isHost
    });
  }, [socket]);

  const startRound = useCallback(() => {
    socket.emit('host:start_round', {
      roundId: `round-${Date.now()}`,
      mode: 'A', // or 'B' depending on your game logic
      correctAnswer: true // or professor ID for mode A
    });
  }, [socket]);

  const submitAnswer = useCallback((choice: boolean | string) => {
    socket.emit('player:submit_answer', {
      choice: { isAI: choice } // Adjust based on your game logic
    });
  }, [socket]);

  const leaveGame = useCallback(() => {
    socket.emit('player:leave');
  }, [socket]);

  return {
    joinGame,
    startRound,
    submitAnswer,
    leaveGame
  };
}