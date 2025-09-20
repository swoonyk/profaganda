// This is the PARENT component for the phases. The purpose of this component is to store the game's state
// (leaderboard data like player's points)
import { useState } from "react";
import Home from "./phases/Home";
import Lobby from "./phases/Lobby";
import Round from "./phases/Round";
import Leaderboard from "./phases/Leaderboard";
import End from "./phases/End";

// Define a Player type
export interface Player {
  name: string;
  points: number;
}

// Union type for the different game phases
type GamePhase = "home" | "lobby" | "round" | "leaderboard" | "end";

export default function GameWindow() {
  const [currentView, setCurrentView] = useState<GamePhase>("home");
  const [players, setPlayers] = useState<Player[]>([
    { name: "Alice", points: 0 },
    { name: "Bob", points: 0 },
  ]);

  const updatePoints = (playerName: string, points: number) => {
    setPlayers((prev) =>
      prev.map((p) => (p.name === playerName ? { ...p, points } : p))
    );
  };

  return (
    <div>
      {currentView === "home" && (
        <Home
          onJoinGame={() => setCurrentView("lobby")}
          onCreateGame={() => setCurrentView("lobby")}
        />
      )}
      {currentView === "lobby" && (
        <Lobby onStart={() => setCurrentView("round")} />
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
    </div>
  );
}
