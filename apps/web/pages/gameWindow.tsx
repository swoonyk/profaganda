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
  const { phase, players, roundNumber, options, partyId, connected, roundId } = useGameState();
  const { joinGame, startRound, submitAnswer, leaveGame } = useGameActions();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleStartLobby = (name: string, isHost: boolean, code?: string) => {
    joinGame(name, isHost, code);
  };

  const handleNextRound = () => {
    startRound();
  };

  // Show loading until client-side is ready
  if (!isClient) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  // Show connection status if not connected
  if (!connected) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Connecting to server...</h2>
        <p>Make sure the socket server is running on port 4000</p>
      </div>
    );
  }

  switch (phase) {
    case "home":
      return <Home onStartLobby={handleStartLobby} />;

    case "lobby":
      return (
        <Lobby
          players={players}
          maxPlayers={4} // default or from server
          joinCode={partyId || "ABC123"}
          onStart={handleNextRound} // host starts first round
          onBack={leaveGame} // back to home
        />
      );

    case "round":
      return (
        <Round
          roundNumber={roundNumber}
          options={options || []}
          onSubmitAnswer={submitAnswer}
        />
      );

    case "leaderboard":
      return (
        <Leaderboard
          players={players}
          roundNumber={roundNumber}
          // host can trigger next round if you want
          onNext={handleNextRound}
        />
      );

    case "end":
      return <End players={players} />;

    default:
      return null;
  }
}
