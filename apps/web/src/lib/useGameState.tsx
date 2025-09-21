import { useEffect, useState } from "react";
import { useSocket } from "./useSocket";

export interface Player {
  playerId: string;
  name: string;
  points: number;
  yourself?: boolean;
  isHost?: boolean;
  // NEW: server sets true once player has submitted at least once in the current round
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

  // NEW: authoritative end time (optional, recommended if server provides)
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

    // Connection
    const onConnect = () => setGameState((prev) => ({ ...prev, connected: true }));
    const onDisconnect = () => setGameState((prev) => ({ ...prev, connected: false }));
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // Server assigns player ID and party ID
    const onConnected = ({ playerId, partyId }: { playerId: string; partyId: string }) => {
      setGameState((prev) => {
        console.log("Connected - preserving gameMode:", prev.gameMode);
        return { ...prev, playerId, partyId };
      });

      // OPTIONAL: ask server for snapshot on reconnect if you support it
      // socket.emit("client:request_state");
    };
    socket.on("connected", onConnected);

    // Update player list from server (preserve hasAnswered if provided)
    const onPlayersUpdate = ({ players }: { players: Player[] }) => {
      setGameState((prev) => ({
        ...prev,
        players: players.map((p) => ({
          ...p,
          yourself: p.playerId === prev.playerId,
          hasAnswered: p.hasAnswered,
        })),
      }));
    };
    socket.on("server:players_update", onPlayersUpdate);

    // Phase changes
    const onPhaseChange = ({ phase }: { phase: GameState["phase"] }) =>
      setGameState((prev) => ({ ...prev, phase }));
    socket.on("server:phase_change", onPhaseChange);

    // Round started (accept roundEndsAt if server provides it)
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
    }) =>
      setGameState((prev) => ({
        ...prev,
        phase: "round",
        roundId,
        options,
        gameMode: mode,
        gameData,
        roundEndsAt, // may be undefined; UI will fall back to local timer
      }));
    socket.on("server:round_started", onRoundStarted);

    // Round results (drives leaderboard phase)
    const onRoundResults = ({
      players,
      roundNumber,
    }: {
      players: Player[];
      roundNumber: number;
    }) =>
      setGameState((prev) => ({
        ...prev,
        phase: "leaderboard",
        players: players.map((p) => ({
          ...p,
          yourself: p.playerId === prev.playerId,
        })),
        roundNumber,
        roundEndsAt: undefined, // clear at end of round
      }));
    socket.on("server:round_results", onRoundResults);

    // Cleanup
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
