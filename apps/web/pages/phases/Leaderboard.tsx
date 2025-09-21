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
  const { roundNumber } = useGameState();
  const { startRound } = useGameActions();

  // Fake data for testing
  const players = [
    { name: "Alice", points: 120 },
    { name: "Bob", points: 90 },
    { name: "Charlie", points: 150 },
    { name: "Esperanza", points: 110, yourself: true },
  ];

  const sortedPlayers = [...players].sort((a, b) => b.points - a.points);

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

      <Button onClick={() => startRound("A")} variant="primary">
        Next Round
      </Button>
    </div>
  );
}
