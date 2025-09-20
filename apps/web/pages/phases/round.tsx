import React from "react";
import { Player } from "../gameWindow";
import { Button } from "components/ui/Button";

interface RoundProps {
  players: Player[];
  updatePoints: (playerName: string, points: number) => void;
  onNext: () => void;
}

export default function Round({ players, updatePoints, onNext }: RoundProps) {
  const handleFinishRound = () => {
    // For demo: randomly add points
    players.forEach((p) =>
      updatePoints(p.name, p.points + Math.floor(Math.random() * 10))
    );
    onNext();
  };

  return (
    <div>
      <h2>Round</h2>
      <ul>
        {players.map((p) => (
          <li key={p.name}>
            {p.name}: {p.points}
          </li>
        ))}
      </ul>
      <Button variant="primary" onClick={handleFinishRound}>
        End Round
      </Button>
    </div>
  );
}
