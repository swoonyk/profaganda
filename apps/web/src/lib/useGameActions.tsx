import { useCallback, useRef } from "react";
import { useSocket } from "./useSocket";

export function useGameActions() {
  const socket = useSocket();
  const currentRoundIdRef = useRef<string | null>(null);
  const playerIdRef = useRef<string | null>(null);

  const joinGame = useCallback(
    (name: string, isHost: boolean, code?: string) => {
      if (!socket) return;

      const playerId = `player-${Math.random().toString(36).slice(2, 8)}`;
      playerIdRef.current = playerId;

      socket.emit("connect_player", {
        playerId,
        partyId: code || `${Math.random().toString(36).slice(2, 8)}`,
        isHost,
        name,
      });
    },
    [socket]
  );

  const startRound = useCallback(
    async (mode: "A" | "B" = "A") => {
      if (!socket) return;

      const roundId = `round-${Date.now()}`;
      currentRoundIdRef.current = roundId;

      let gameData;
      let correctAnswer;
      let options: string[] = [];

      try {
        // Get the API base URL - must be explicitly set for cross-domain API calls
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
        
        if (!apiBaseUrl) {
          throw new Error('NEXT_PUBLIC_API_URL environment variable is not set');
        }

        if (mode === "A") {
          const response = await fetch(
            `${apiBaseUrl}/game/mode1/question`
          );
          if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
          }
          gameData = await response.json();
          correctAnswer = gameData.correctProfessorId;
          options = gameData.professorOptions.map((p: any) => p._id);
        } else {
          const response = await fetch(
            `${apiBaseUrl}/game/mode2/question`
          );
          if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
          }
          gameData = await response.json();
          correctAnswer = gameData.isRealReview; // true if real, false if AI
          options = ["real", "ai"];
        }

        socket.emit("host:start_round", {
          roundId,
          mode,
          correctAnswer,
          options,
        });
      } catch (error) {
        console.error("Failed to start round:", error);
      }
    },
    [socket]
  );

  const submitAnswer = useCallback(
    (choice: boolean | string) => {
      if (!socket || !currentRoundIdRef.current) {
        console.error(
          "No socket connection or active round to submit answer to"
        );
        return;
      }

      socket.emit("player:submit_answer", {
        roundId: currentRoundIdRef.current,
        choice,
      });
    },
    [socket]
  );

  const leaveGame = useCallback(() => {
    if (socket) {
      socket.disconnect();
    }
    currentRoundIdRef.current = null;
    playerIdRef.current = null;
  }, [socket]);

  return {
    joinGame,
    startRound,
    submitAnswer,
    leaveGame,
    currentRoundId: currentRoundIdRef.current,
    playerId: playerIdRef.current,
  };
}
