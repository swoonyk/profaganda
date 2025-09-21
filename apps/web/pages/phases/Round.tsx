import React, { useEffect, useState } from "react";
import { Button } from "components/ui/Button";
import { useGameState } from "@/lib/useGameState";
import { useGameActions } from "@/lib/useGameActions";
import MuteButton from "components/MuteButton";

type RoundProps = {
  muted: boolean;
  toggleMute: () => void;
};

export default function Round({ muted, toggleMute }: RoundProps) {
  const { players, roundNumber, options = [] } = useGameState();
  const { submitAnswer } = useGameActions();
  const [timeLeft, setTimeLeft] = useState(30);

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

  return (
    <div className="round">
      <MuteButton muted={muted} toggleMute={toggleMute} />

      <div className="header">
        <p>Time left: {timeLeft} secs</p>
        <p>Question {roundNumber} / 5</p>
        <p style={{ fontSize: 12, color: "#666" }}>Players: {players.length}</p>
      </div>

      <div className="scoreboard">
        {players.map((p) => (
          <p key={p.name}>
            {p.name}: {p.points} {p.yourself && "(you)"}
          </p>
        ))}
      </div>

      <div className="panel">
        <p>Quote goes here</p>
      </div>

      <ul>
        {options.map((opt, i) => (
          <li key={i}>
            <button onClick={() => submitAnswer(opt)} className="option">
              {opt}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
