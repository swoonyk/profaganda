import React from "react";
import { Button } from "components/ui/Button";
import { Player } from "pages/gameWindow";

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
    <div className="round">
      <div className="header">
        <p>34 secs left</p>

        <p>Question X on 10</p>
      </div>

      <h2>Round</h2>

      <p>Quote is here</p>

      <ul>
        <li>option 1</li>
        <li>option 2</li>
        <li>option 3</li>
        <li>option 4</li>
      </ul>

      {/* <ul>
        {players.map((p) => (
          <li key={p.name}>
            {p.name}: {p.points}
          </li>
        ))}
      </ul> */}

      <Button variant="primary" onClick={handleFinishRound}>
        Finish round, show leaderboard
      </Button>
    </div>
  );
}
