import Home from "./phases/Home";
import Lobby from "./phases/Lobby";
import Round from "./phases/Round";
import Leaderboard from "./phases/Leaderboard";
import End from "./phases/End";
import { useGameState } from "@/lib/useGameState";
import { useGameActions } from "@/lib/useGameActions";

export interface Player {
  name: string;
  points: number;
  yourself?: boolean;
  isHost?: boolean;
}

export default function GameWindow() {
  const { phase, players, roundNumber, options, partyId } = useGameState();
  const { joinGame, startRound, submitAnswer, leaveGame } = useGameActions();

  // Host starts lobby
  const handleStartLobby = (name: string, isHost: boolean, code?: string) => {
    joinGame(name, isHost, code);
  };

  // Host manually advances to next round (or ends game)
  const handleNextRound = () => {
    startRound(); // emits socket event to server
    // server will send back updated roundNumber and phase
  };

  // Pass all original props to children
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
