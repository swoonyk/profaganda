import React from "react";
import { Player } from "../GameWindow";

interface LeaderboardProps {
  players: Player[];
  onNext: () => void;
}

export default function Leaderboard({ players, onNext }: LeaderboardProps) {
  return (
    <div>
      <h2>Leaderboard</h2>
      <ul>
        {players
          .slice()
          .sort((a, b) => b.points - a.points)
          .map((p) => (
            <li key={p.name}>
              {p.name}: {p.points}
            </li>
          ))}
      </ul>
      <button onClick={onNext}>Next Round</button>
    </div>
  );
}
