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
  isHost?: boolean;
}

type GamePhase = "home" | "lobby" | "round" | "leaderboard" | "end";

export default function GameWindow() {
  // Centralized state
  const [currentView, setCurrentView] = useState<GamePhase>("home");
  const [players, setPlayers] = useState<Player[]>([]);
  const [roundNumber, setRoundNumber] = useState(1);
  const maxRounds = 5;

  const updatePoints = (playerName: string, points: number) => {
    setPlayers((prev) =>
      prev.map((p) => (p.name === playerName ? { ...p, points } : p))
    );
  };

  // Start or join lobby
  const startLobby = (name: string, isHost: boolean, code?: string) => {
    // In live game: send WS message to create/join lobby
    setPlayers([{ name, points: 0, yourself: true, isHost }]);
    setRoundNumber(1);
    setCurrentView("lobby");
  };

  // Host starts round
  const handleStartRound = () => setCurrentView("round");

  // Move from leaderboard to next round or end
  const handleNextRound = () => {
    if (roundNumber >= maxRounds) {
      setCurrentView("end");
    } else {
      setRoundNumber(roundNumber + 1);
      setCurrentView("round");
    }
  };

  // Placeholder: receive messages from server
  const handleServerMessage = (msg: any) => {
    switch (msg.type) {
      case "updatePlayers":
        setPlayers(msg.players);
        break;
      case "phaseChange":
        setCurrentView(msg.phase);
        break;
      case "roundChange":
        setRoundNumber(msg.round);
        break;
      default:
        break;
    }
  };

  //TODO: make it so the round can change based on a webhook (because the non-hosts will need that!) for host it should just be based on click but other players webhook ig

  return (
    <>
      {/* FOR PHASE: HOME */}
      {currentView === "home" && <Home onStartLobby={startLobby} />}

      {/* FOR PHASE: LOBBY */}
      {currentView === "lobby" && (
        <Lobby
          players={players}
          onStart={() => setCurrentView("round")}
          onBack={() => setCurrentView("home")}
        />
      )}

      {/* FOR PHASE: ROUND */}
      {currentView === "round" && (
        <Round
          players={players}
          updatePoints={updatePoints}
          roundNumber={roundNumber}
          onNext={() => {
            setCurrentView("leaderboard");
          }}
        />
      )}

      {/* FOR PHASE: LEADERBOARD */}
      {currentView === "leaderboard" && (
        <Leaderboard
          players={players}
          roundNumber={roundNumber}
          onNext={handleNextRound} // <- switch to next round or end
        />
      )}
      {currentView === "end" && <End players={players} />}
    </>
  );
}
