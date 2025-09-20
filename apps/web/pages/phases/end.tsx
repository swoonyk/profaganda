import React from "react";
import { Player } from "../gameWindow";

interface EndProps {
  players: Player[];
}

export default function End({ players }: EndProps) {
  const winner = players.reduce((top, p) => (p.points > top.points ? p : top));

  return (
    <div>
      <h2>Game Over</h2>
      <p>
        Winner: {winner.name} with {winner.points} points!
      </p>
      <h3>Final Scores:</h3>
      <ul>
        {players.map((p) => (
          <li key={p.name}>
            {p.name}: {p.points}
          </li>
        ))}
      </ul>
    </div>
  );
}
