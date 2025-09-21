import { useEffect, useState, useRef } from "react";
import { Socket } from "socket.io-client";
import { useSocket } from "./useSocket";

export interface Player {
  name: string;
  points: number;
  yourself?: boolean;
  isHost?: boolean;
}

export interface GameState {
  phase: "home" | "lobby" | "round" | "leaderboard" | "end";
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
  connected: boolean;
  playerId?: string;
}

export function useGameState() {
  const socket = useSocket();
  const playerIdRef = useRef<string | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    phase: "home",
    players: [],
    roundNumber: 1,
    connected: false,
  });

  useEffect(() => {
    if (!socket) return;

    // Connection events
    socket.on("connect", () => {
      setGameState((prev) => ({ ...prev, connected: true }));
    });

    socket.on("disconnect", () => {
      setGameState((prev) => ({ ...prev, connected: false }));
    });

    socket.on("connected", ({ playerId, partyId }) => {
      playerIdRef.current = playerId;
      setGameState((prev) => ({
        ...prev,
        playerId,
        partyId,
      }));
    });

    socket.on("server:players_update", ({ players }) => {
      const updatedPlayers = players.map((player: any) => ({
        ...player,
        yourself:
          player.name === playerIdRef.current ||
          player.playerId === playerIdRef.current,
      }));

      setGameState((prev) => ({ ...prev, players: updatedPlayers }));
    });

    socket.on("server:phase_change", ({ phase }) => {
      setGameState((prev) => ({ ...prev, phase }));
    });

    socket.on("server:round_started", ({ roundId, mode, options }) => {
      setGameState((prev) => ({
        ...prev,
        phase: "round",
        roundId,
        options,
      }));
    });

    socket.on("server:round_results", ({ players, roundNumber }) => {
      const updatedPlayers = players.map((player: any) => ({
        ...player,
        yourself: player.name === playerIdRef.current,
      }));

      setGameState((prev) => ({
        ...prev,
        phase: "leaderboard",
        players: updatedPlayers,
        roundNumber,
      }));
    });

    socket.on("server:answer_ack", ({ roundId, accepted, correct, points }) => {
      if (accepted) {
        console.log(
          `Answer submitted successfully for round ${roundId}. Correct: ${correct}, Points: ${points}`
        );
      } else {
        console.log(`Answer rejected for round ${roundId}`);
      }
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connected");
      socket.off("server:players_update");
      socket.off("server:phase_change");
      socket.off("server:round_started");
      socket.off("server:round_results");
      socket.off("server:answer_ack");
    };
  }, [socket]);

  return { ...gameState, setGameState };
}
