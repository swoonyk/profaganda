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
        <p style={{ fontSize: 12, color: "#ffff" }}>
          Players: {players.length}
        </p>
      </div>

      <div className="scoreboard">
        {players.map((p) => (
          <p key={p.name}>
            {p.name}: {p.points} {p.yourself && "(you)"}
          </p>
        ))}
      </div>

      <div className="panel">
        <p>
          They are hands down one of the best professors. ever. They are very
          engaging and has very well planned out lectures and slides, and as
          someone who has never taken a CS class before, they made all the basic
          concepts easy to learn.
        </p>
      </div>

      <ul>
        {options.map((opt, i) => (
          <li key={i}>
            <div className="option" onClick={() => submitAnswer(opt)}>
              {opt}
            </div>
          </li>
        ))}

        {/* gotta manually apply colors andicons */}
        <div className="options-grid">
          <div className="option">Anton Mosunov</div>

          <div className="option">me</div>

          <div className="option correct">
            <div className="checkmark">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            Walker White
          </div>
          <div className="option incorrect">
            <div className="checkmark">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </div>
            Matthew Eichhorn
          </div>
        </div>
      </ul>
    </div>
  );
}
