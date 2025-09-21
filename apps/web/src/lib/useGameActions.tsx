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

      console.log(`Starting round ${roundId} in mode ${mode}`);

      // Immediately start the round for fast UX
      socket.emit("host:start_round", {
        roundId,
        mode,
        loading: true,
      });

      // Fetch data from production API in parallel
      let gameData: any;
      let correctAnswer: any;
      let options: string[] = [];

      try {
        const apiUrl = mode === "A" 
          ? "https://api-chi-neon.vercel.app/game/mode1/question"
          : "https://api-chi-neon.vercel.app/game/mode2/question";

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          // 8 second timeout for API calls
          signal: AbortSignal.timeout(8000)
        });

        if (response.ok) {
          gameData = await response.json();
          
          if (!gameData.error) {
            if (mode === "A") {
              correctAnswer = gameData.correctProfessorId;
              options = gameData.professorOptions.map((p: any) => p._id);
            } else {
              correctAnswer = gameData.isRealReview;
              options = ["real", "ai"];
            }

            // Send real data to server
            socket.emit("host:update_round", {
              roundId,
              correctAnswer,
              options,
              gameData,
            });

            console.log(`✅ Round ${roundId} loaded with real data`);
            return;
          }
        }

        throw new Error(`API failed: ${response.status}`);
        
      } catch (error) {
        console.warn(`⚠️ Production API failed, using local fallback:`, error);
        
        // Fallback to local API
        try {
          const localUrl = mode === "A" 
            ? "/api/game/mode1/question"
            : "/api/game/mode2/question";

          const response = await fetch(localUrl);
          if (response.ok) {
            gameData = await response.json();
            
            if (mode === "A") {
              correctAnswer = gameData.correctProfessorId;
              options = gameData.professorOptions.map((p: any) => p._id);
            } else {
              correctAnswer = gameData.isRealReview;
              options = ["real", "ai"];
            }

            socket.emit("host:update_round", {
              roundId,
              correctAnswer,
              options,
              gameData,
            });

            console.log(`✅ Round ${roundId} loaded with local fallback data`);
          } else {
            throw new Error(`Local API failed: ${response.status}`);
          }
        } catch (localError) {
          console.error(`❌ Both APIs failed:`, localError);
          // Game will continue with empty state - server can handle this
        }
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
