import React from "react";
import Home from "./phases/Home";
import Lobby from "./phases/Lobby";
import Round from "./phases/Round";
import RoundMode2 from "./phases/RoundMode2";
import Leaderboard from "./phases/Leaderboard";
import End from "./phases/End";
import { useGameState } from "@/lib/useGameState";
import { useGameActions } from "@/lib/useGameActions";
import { useEffect, useState } from "react";

type GameWindowProps = {
  muted: boolean;
  toggleMute: () => void;
};

export default function GameWindow({ muted, toggleMute }: GameWindowProps) {
  const {
    phase,
    players,
    roundNumber,
    options,
    partyId,
    connected,
    setGameState,
    gameMode,
    gameData,
  } = useGameState();

  const { joinGame, startRound, submitAnswer, leaveGame } = useGameActions();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);
  // const forcedPhase = "round";

  const handleStartLobby = (
    name: string,
    isHost: boolean,
    code?: string,
    mode?: "A" | "B"
  ) => {
    // Create a temporary playerId for optimistic UI
    const tempPlayerId = "temp_" + Math.random().toString(36).substr(2, 9);

    // Optimistic UI: show yourself immediately
    setGameState((prev) => ({
      ...prev,
      phase: "lobby",
      gameMode: mode || "A", // Store the selected mode
      players: [
        { name, points: 0, yourself: true, isHost, playerId: tempPlayerId },
      ],
    }));

    // Tell the server to join/create game
    joinGame(name, isHost, code);
  };

  if (!isClient) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (!connected) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <h2>Connecting to server...</h2>
        <p>Attempting to connect to the game server...</p>
      </div>
    );
  }

  switch (phase) {
    case "home":
      return (
        <Home
          onStartLobby={handleStartLobby}
          muted={muted}
          toggleMute={toggleMute}
        />
      );

    case "lobby":
      return <Lobby muted={muted} toggleMute={toggleMute} />;

    case "round":
      return gameMode === "B" ? (
        <RoundMode2 muted={muted} toggleMute={toggleMute} />
      ) : (
        <Round muted={muted} toggleMute={toggleMute} />
      );

    case "leaderboard":
      return <Leaderboard muted={muted} toggleMute={toggleMute} />;

    case "end":
      return <End muted={muted} toggleMute={toggleMute} />;

    default:
      return null;
  }

  // return <End muted={muted} toggleMute={toggleMute} />;
}
