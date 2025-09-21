import React from "react";
import { Button } from "components/ui/Button";
import { useGameState } from "@/lib/useGameState";
import { useGameActions } from "@/lib/useGameActions";

function LeaderboardItem({
  player,
  isYourself,
}: {
  player: any;
  isYourself?: boolean;
}) {
  return (
    <li
      className={isYourself ? "leaderboard-item yourself" : "leaderboard-item"}
    >
      {player.name}: {player.points}
      {isYourself && <span className="yourself-label"> (You)</span>}
    </li>
  );
}

type LeaderboardProps = {
  muted: boolean;
  toggleMute: () => void;
};

export default function Leaderboard({ muted, toggleMute }: LeaderboardProps) {
  const { players, roundNumber } = useGameState();
  const { startRound } = useGameActions();

  return (
    <div className="leaderboard">
      <div className="header">
        <h1>Leaderboard</h1>
        <p>Question {roundNumber} out of 5</p>
      </div>

      <ul>
        {players
          .slice()
          .sort((a, b) => b.points - a.points)
          .map((p) => (
            <LeaderboardItem key={p.name} player={p} isYourself={p.yourself} />
          ))}
      </ul>

      <Button onClick={() => startRound("A")} variant="primary">
        Next Round
      </Button>
    </div>
  );
}
