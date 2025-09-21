import { useEffect, useState } from "react";
import { useSocket } from "./useSocket";

export interface Player {
  playerId: string;
  name: string;
  points: number;
  yourself?: boolean;
  isHost?: boolean;
}

export interface GameState {
  phase: "home" | "lobby" | "round" | "leaderboard" | "end";
  players: Player[];
  roundNumber: number;
  options?: string[];
  roundId?: string;
  partyId?: string;
  connected: boolean;
  playerId?: string;
  gameMode?: "A" | "B";
  gameData?: any;
}

export function useGameState() {
  const socket = useSocket();
  const [gameState, setGameState] = useState<GameState>({
    phase: "home",
    players: [],
    roundNumber: 1,
    connected: false,
  });

  useEffect(() => {
    if (!socket) return;

    // Connection
    socket.on("connect", () =>
      setGameState((prev) => ({ ...prev, connected: true, gameMode: prev.gameMode }))
    );
    socket.on("disconnect", () =>
      setGameState((prev) => ({ ...prev, connected: false, gameMode: prev.gameMode }))
    );

    // Server assigns player ID and party ID
    socket.on(
      "connected",
      ({ playerId, partyId }: { playerId: string; partyId: string }) => {
        setGameState((prev) => {
          console.log("Connected - preserving gameMode:", prev.gameMode);
          // Get gameMode from localStorage if it's lost
          const storedMode = typeof window !== "undefined" 
            ? localStorage.getItem("selectedGameMode") as "A" | "B" | null
            : null;
          const gameMode = prev.gameMode || storedMode || "A";
          console.log("Using gameMode:", gameMode, "from storage:", storedMode);
          
          return { ...prev, playerId, partyId, gameMode };
        });
      }
    );

    // Update player list from server
    socket.on("server:players_update", ({ players }: { players: Player[] }) => {
      setGameState((prev) => ({
        ...prev,
        gameMode: prev.gameMode, // Preserve gameMode
        players: players.map((p) => ({
          ...p,
          yourself: p.playerId === prev.playerId,
        })),
      }));
    });

    // Phase changes
    socket.on(
      "server:phase_change",
      ({ phase }: { phase: GameState["phase"] }) =>
        setGameState((prev) => ({ ...prev, phase, gameMode: prev.gameMode }))
    );

    // Round started
    socket.on(
      "server:round_started",
      ({
        roundId,
        options,
        mode,
        gameData,
      }: {
        roundId: string;
        options: string[];
        mode?: "A" | "B";
        gameData?: any;
      }) =>
        setGameState((prev) => ({
          ...prev,
          phase: "round",
          roundId,
          options,
          gameMode: mode,
          gameData,
        }))
    );

    // Round results
    socket.on(
      "server:round_results",
      ({ players, roundNumber }: { players: Player[]; roundNumber: number }) =>
        setGameState((prev) => ({
          ...prev,
          phase: "leaderboard",
          gameMode: prev.gameMode, // Preserve gameMode
          players: players.map((p) => ({
            ...p,
            yourself: p.playerId === prev.playerId,
          })),
          roundNumber,
        }))
    );

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connected");
      socket.off("server:players_update");
      socket.off("server:phase_change");
      socket.off("server:round_started");
      socket.off("server:round_results");
    };
  }, [socket]);

  return { ...gameState, setGameState };
}
