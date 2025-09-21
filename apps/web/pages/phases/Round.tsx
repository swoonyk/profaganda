import React, { useEffect, useState } from "react";
import { Button } from "components/ui/Button";
import { useGameState } from "@/lib/useGameState";

interface RoundProps {
  roundNumber: number;
  options: string[];
  onSubmitAnswer: (choice: string | boolean) => void;
  duration?: number;
}

export default function Round({
  roundNumber,
  options,
  onSubmitAnswer,
  duration = 30,
}: RoundProps) {
  const { players } = useGameState(); // live scores from server
  const [timeLeft, setTimeLeft] = useState(duration);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleAnswer = (choice: string | boolean) => {
    onSubmitAnswer(choice);
  };

  return (
    <div className="round">
      {/* Header with timer and round number */}
      <div className="header">
        <p>Time left: {timeLeft} secs</p>
        <p>
          Question {roundNumber} <span className="slash">/</span> 5
        </p>
      </div>

      {/* Optional scoreboard */}
      <div className="scoreboard">
        {players.map((p) => (
          <p key={p.name}>
            {p.name}: {p.points} {p.yourself && "(you)"}
          </p>
        ))}
      </div>

      {/* Quote / question placeholder */}
      <div className="panel">
        <p>Quote is here</p>
      </div>

      {/* Option buttons */}
      <ul>
        {options.map((opt, i) => (
          <li key={i}>
            <Button onClick={() => handleAnswer(opt)}>{opt}</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
