import { useState } from "react";
import Home from "./phases/Home";
import Lobby from "./phases/Lobby";
import Round from "./phases/Round";
import Leaderboard from "./phases/Leaderboard";
import End from "./phases/End";

// Player type
export interface Player {
  name: string;
  points: number;
  yourself?: boolean; // <-- Add this line
}

// Phases
type GamePhase = "home" | "lobby" | "round" | "leaderboard" | "end";

export default function GameWindow() {
  const [currentView, setCurrentView] = useState<GamePhase>("home");
  const [players, setPlayers] = useState<Player[]>([
    { name: "Alice", points: 0, yourself: true },
    { name: "Bob", points: 0 },
  ]);

  const updatePoints = (playerName: string, points: number) => {
    setPlayers((prev) =>
      prev.map((p) => (p.name === playerName ? { ...p, points } : p))
    );
  };

  // This handles both Create and Join from Home
  const startLobby = (name: string, isHost: boolean, code?: string) => {
    // For now, just add the player. You can extend later for multiplayer/code validation
    setPlayers([{ name, points: 0 }]);
    setCurrentView("lobby");
    console.log("Start lobby", { name, isHost, code });
  };

  return (
    <>
      {currentView === "home" && (
        <Home
          onJoinGame={() => setCurrentView("lobby")}
          onCreateGame={() => setCurrentView("lobby")}
        />
      )}
      {currentView === "lobby" && (
        <Lobby players={players} onStart={() => setCurrentView("round")} />
      )}
      {currentView === "round" && (
        <Round
          players={players}
          updatePoints={updatePoints}
          onNext={() => setCurrentView("leaderboard")}
        />
      )}
      {currentView === "leaderboard" && (
        <Leaderboard players={players} onNext={() => setCurrentView("round")} />
      )}
      {currentView === "end" && <End players={players} />}
    </>
  );
}
