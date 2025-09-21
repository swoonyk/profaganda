import { useCallback, useEffect, useRef } from "react";
import { useSocket } from "./useSocket";

export function useGameActions() {
  const socket = useSocket();
  const currentRoundIdRef = useRef<string | null>(null);
  const playerIdRef = useRef<string | null>(null);

  // Capture roundId for all clients when a round starts
  useEffect(() => {
    if (!socket) return;

    const onRoundStarted = ({ roundId }: { roundId: string }) => {
      console.log("useGameActions:onRoundStarted -> roundId", roundId);
      currentRoundIdRef.current = roundId;
    };
    const onRoundResults = () => {
      console.log("useGameActions:onRoundResults");
      // optional: currentRoundIdRef.current = null;
    };

    socket.on("server:round_started", onRoundStarted);
    socket.on("server:round_results", onRoundResults);
    return () => {
      socket.off("server:round_started", onRoundStarted);
      socket.off("server:round_results", onRoundResults);
    };
  }, [socket]);

  const joinGame = useCallback(
    (name: string, isHost: boolean, code?: string) => {
      if (!socket) return;

      const playerId = `player-${Math.random().toString(36).slice(2, 8)}`;
      playerIdRef.current = playerId;

      console.log("useGameActions:joinGame emit connect_player", {
        playerId,
        isHost,
        code,
      });

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

      let gameData: any;
      let correctAnswer: any;
      let options: string[] = [];

      try {
        console.log("useGameActions:startRound -> fetching question for mode", mode);

        if (mode === "A") {
          const response = await fetch("/api/game/mode1/question");
          if (!response.ok)
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
          gameData = await response.json();
          correctAnswer = gameData.correctProfessorId;
          options = gameData.professorOptions.map((p: any) => p._id);
        } else {
          const response = await fetch("/api/game/mode2/question");
          if (!response.ok)
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
          gameData = await response.json();
          correctAnswer = gameData.isRealReview; // true if real, false if AI
          options = ["real", "ai"];
        }

        const payload = {
          roundId,
          mode,
          correctAnswer,
          options,
          gameData,
          // Prefer computing roundEndsAt on the server and including it in server:round_started
          // roundEndsAt: new Date(Date.now() + 30_000).toISOString()
        };
        console.log("useGameActions:startRound emit host:start_round", payload);
        socket.emit("host:start_round", payload);
      } catch (error) {
        console.error("Failed to start round:", error);
      }
    },
    [socket]
  );

  const submitAnswer = useCallback(
    (choice: boolean | string) => {
      if (!socket || !currentRoundIdRef.current) {
        console.error("No socket connection or active round to submit answer to");
        return;
      }

      const payload = {
        roundId: currentRoundIdRef.current,
        choice,
      };
      console.log("useGameActions:submitAnswer emit player:submit_answer", payload);
      socket.emit("player:submit_answer", payload);
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
