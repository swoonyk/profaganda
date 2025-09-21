import { useEffect, useState } from "react";
import { useSocket } from "./useSocket";

export interface Player {
  playerId: string;
  name: string;
  points: number;
  yourself?: boolean;
  isHost?: boolean;
  // Server sets true once player has submitted at least once in the current round
  hasAnswered?: boolean;
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

  // Authoritative end time (optional, recommended if server provides)
  roundEndsAt?: string; // ISO timestamp like "2025-09-21T09:00:00.000Z"
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

    // --- Named handlers so we can .off() them later ---

    const onConnect = () => {
      setGameState((prev) => ({
        ...prev,
        connected: true,
        gameMode: prev.gameMode, // preserve
      }));
    };

    const onDisconnect = () => {
      setGameState((prev) => ({
        ...prev,
        connected: false,
        gameMode: prev.gameMode, // preserve
      }));
    };

    const onConnected = ({
      playerId,
      partyId,
    }: {
      playerId: string;
      partyId: string;
    }) => {
      setGameState((prev) => {
        // Fall back to stored mode if prev lost it
        const storedMode =
          typeof window !== "undefined"
            ? (localStorage.getItem("selectedGameMode") as "A" | "B" | null)
            : null;
        const gameMode = prev.gameMode || storedMode || "A";
        return { ...prev, playerId, partyId, gameMode };
      });
    };

    const onPlayersUpdate = ({ players }: { players: Player[] }) => {
      setGameState((prev) => ({
        ...prev,
        gameMode: prev.gameMode, // preserve
        players: players.map((p) => ({
          ...p,
          yourself: p.playerId === prev.playerId,
          hasAnswered: p.hasAnswered,
        })),
      }));
    };

    const onPhaseChange = ({ phase }: { phase: GameState["phase"] }) => {
      setGameState((prev) => ({
        ...prev,
        phase,
        gameMode: prev.gameMode, // preserve
      }));
    };

    const onRoundStarted = ({
      roundId,
      options,
      mode,
      gameData,
      roundEndsAt,
    }: {
      roundId: string;
      options: string[];
      mode?: "A" | "B";
      gameData?: any;
      roundEndsAt?: string;
    }) => {
      setGameState((prev) => ({
        ...prev,
        phase: "round",
        roundId,
        options,
        gameMode: mode, // server may override with chosen mode
        gameData,
        roundEndsAt, // may be undefined; UI falls back to local timer
      }));
    };

    const onRoundResults = ({
      players,
      roundNumber,
    }: {
      players: Player[];
      roundNumber: number;
    }) => {
      setGameState((prev) => ({
        ...prev,
        phase: "leaderboard",
        gameMode: prev.gameMode, // preserve
        players: players.map((p) => ({
          ...p,
          yourself: p.playerId === prev.playerId,
        })),
        roundNumber,
        roundEndsAt: undefined, // clear timing at end of round
      }));
    };

    // --- Register with named handlers ---
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connected", onConnected);
    socket.on("server:players_update", onPlayersUpdate);
    socket.on("server:phase_change", onPhaseChange);
    socket.on("server:round_started", onRoundStarted);
    socket.on("server:round_results", onRoundResults);

    // --- Cleanup with the same named handlers ---
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connected", onConnected);
      socket.off("server:players_update", onPlayersUpdate);
      socket.off("server:phase_change", onPhaseChange);
      socket.off("server:round_started", onRoundStarted);
      socket.off("server:round_results", onRoundResults);
    };
  }, [socket]);

  return { ...gameState, setGameState };
}
