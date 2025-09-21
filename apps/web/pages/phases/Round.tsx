import React, { useEffect, useState } from "react";
import { Button } from "components/ui/Button";
import { Player } from "pages/GameWindow";

interface RoundProps {
  players: Player[];
  updatePoints: (playerName: string, points: number) => void;
  onNext: () => void;
  duration?: number;
}

export default function Round({
  players,
  updatePoints,
  onNext,
  duration = 30,
}: RoundProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onNext]);

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
        <p>Time left: {timeLeft} secs</p>

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
