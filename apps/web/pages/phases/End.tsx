import React from "react";
import { useGameState } from "@/lib/useGameState";
import { useGameActions } from "@/lib/useGameActions";

export default function End() {
  const { players } = useGameState();
  const { leaveGame } = useGameActions();

  if (!players.length) return <div>No players found.</div>;

  const winner = players.reduce((top, p) => (p.points > top.points ? p : top));

  return (
    <div className="end">
      <h2>Game Over</h2>
      <p>
        Winner: {winner.name} with {winner.points} points!
      </p>

      <h3>Final Scores:</h3>
      <ul>
        {players.map((p) => (
          <li key={p.name}>
            {p.name}: {p.points} {p.yourself && "(you)"}
          </li>
        ))}
      </ul>

      <button onClick={leaveGame}>Back to Home</button>
    </div>
  );
}
