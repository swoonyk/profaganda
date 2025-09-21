import React from "react";
import { Button } from "components/ui/Button";
import { Player, useGameState } from "@/lib/useGameState";
import { useGameActions } from "@/lib/useGameActions";
import MuteButton from "components/MuteButton";

interface LeaderboardItemProps {
  player: Pick<Player, "name" | "points" | "yourself">;
  isYourself?: boolean;
}

function LeaderboardItem({ player, isYourself }: LeaderboardItemProps) {
  return (
    <li
      className={isYourself ? "leaderboard-item yourself" : "leaderboard-item"}
    >
      <p className="player-name">
        {player.name}{" "}
        {player.yourself && <span className="yourself-label"> (You)</span>}
      </p>{" "}
      <p className="pts player-points">{player.points}</p>
    </li>
  );
}

type LeaderboardProps = {
  muted: boolean;
  toggleMute: () => void;
};

export default function Leaderboard({ muted, toggleMute }: LeaderboardProps) {
  const { roundNumber, gameMode, players } = useGameState();
  const { startRound } = useGameActions();
  
  // Get mode from game state, localStorage, or default to A
  const storedMode = typeof window !== "undefined" 
    ? localStorage.getItem("selectedGameMode") as "A" | "B" | null
    : null;
  const selectedMode = gameMode || storedMode || "A";

  // Use real player data from game state, with fallback to fake data for testing
  const realPlayers = players.length > 0 ? players : [
    { name: "Alice", points: 120 },
    { name: "Bob", points: 90 },
    { name: "Charlie", points: 150 },
    { name: "Esperanza", points: 110, yourself: true },
  ];

  const sortedPlayers = [...realPlayers].sort((a, b) => b.points - a.points);

  return (
    <div className="leaderboard">
      <MuteButton muted={muted} toggleMute={toggleMute} />

      <div className="top">
        <div className="header">
          <h1>Leaderboard</h1>
          <p>Question {roundNumber} / 5</p>
        </div>

        <ul>
          {sortedPlayers.map((p) => (
            <LeaderboardItem key={p.name} player={p} />
          ))}
        </ul>
      </div>

      <Button onClick={() => startRound(selectedMode)} variant="primary">
        Next Round
      </Button>
    </div>
  );
}
