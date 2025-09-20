import { useState } from "react";
import Home from "./phases/Home";
import Lobby from "./phases/Lobby";
import Round from "./phases/Round";
import Leaderboard from "./phases/Leaderboard";
import End from "./phases/End";

export interface Player {
  name: string;
  points: number;
  yourself?: boolean; // <-- Add this line
}

type GamePhase = "home" | "lobby" | "round" | "leaderboard" | "end";

export default function GameWindow() {
  const [currentView, setCurrentView] = useState<GamePhase>("home");
  const [players, setPlayers] = useState<Player[]>([
    { name: "Alice", points: 0, yourself: true },
    { name: "Bob", points: 0 },
  ]);
  const [roundNumber, setRoundNumber] = useState(1);
  const maxRounds = 5;

  const updatePoints = (playerName: string, points: number) => {
    setPlayers((prev) =>
      prev.map((p) => (p.name === playerName ? { ...p, points } : p))
    );
  };

  const startLobby = (name: string, isHost: boolean, code?: string) => {
    setPlayers([{ name, points: 0 }]); // add host/joining player
    setRoundNumber(1); // reset rounds
    setCurrentView("lobby");
  };

  const goToNextRoundOrEnd = () => {
    if (roundNumber >= maxRounds) {
      setCurrentView("end");
    } else {
      setRoundNumber(roundNumber + 1);
      setCurrentView("round");
    }
  };

  return (
    <>
      {currentView === "home" && <Home onStartLobby={startLobby} />}
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
        <Leaderboard
          players={players}
          onNext={goToNextRoundOrEnd} // <- switch to next round or end
        />
      )}
      {currentView === "end" && <End players={players} />}
    </>
  );
}
