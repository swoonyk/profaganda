import React from "react";
import { Button } from "components/ui/Button";
import { Player } from "pages/gameWindow";

interface LeaderboardItemProps {
  player: Player;
  isYourself?: boolean;
}

function LeaderboardItem({ player, isYourself }: LeaderboardItemProps) {
  return (
    <li
      className={isYourself ? "leaderboard-item yourself" : "leaderboard-item"}
    >
      {player.name}: {player.points}
      {isYourself && <span className="yourself-label"> (You)</span>}
    </li>
  );
}

interface LeaderboardProps {
  players: Player[];
  onNext: () => void;
  yourselfName?: string;
}

export default function Leaderboard({
  players,
  onNext,
  yourselfName,
}: LeaderboardProps) {
  return (
    <div className="leaderboard">
      <div className="header">
        <h1>Leaderboard</h1>
        <p>Question X out of 10</p>
      </div>
      <ul>
        {players
          .slice()
          .sort((a, b) => b.points - a.points)
          .map((p) => (
            <LeaderboardItem
              key={p.name}
              player={p}
              isYourself={yourselfName === p.name}
            />
          ))}
      </ul>

      <Button onClick={onNext} variant="primary">
        Next Round
      </Button>
    </div>
  );
}
