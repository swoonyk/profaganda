import Home from "./phases/Home";
import Lobby from "./phases/Lobby";
import Round from "./phases/Round";
import Leaderboard from "./phases/Leaderboard";
import End from "./phases/End";
import { useGameState } from "@/lib/useGameState";
import { useGameActions } from "@/lib/useGameActions";
import { useEffect, useState } from "react";

export interface Player {
  name: string;
  points: number;
  yourself?: boolean;
  isHost?: boolean;
}

export default function GameWindow() {
  const { phase, players, roundNumber, options, partyId, connected } =
    useGameState();
  const { joinGame, startRound, submitAnswer, leaveGame } = useGameActions();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  const handleStartLobby = (name: string, isHost: boolean, code?: string) => {
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
        <p>Make sure the socket server is running on port 4000</p>
      </div>
    );
  }

  switch (phase) {
    case "home":
      return <Home />;

    case "lobby":
      return <Lobby />;

    case "round":
      return <Round />;

    case "leaderboard":
      return <Leaderboard />;

    case "end":
      return <End />;

    default:
      return null;
  }
}
