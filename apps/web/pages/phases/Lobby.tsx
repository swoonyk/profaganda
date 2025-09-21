import { Button } from "components/ui/Button";
import React, { useState } from "react";
import { Player } from "../GameWindow";

interface LobbyProps {
  players: Player[];
  maxPlayers?: number;
  joinCode?: string;
  onStart: () => void;
  onBack: () => void;
}

export default function Lobby({
  players,
  maxPlayers = 4,
  joinCode = "ABC123",
  onStart,
  onBack,
}: LobbyProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(joinCode)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // reset after 2s
      })
      .catch(() => {
        alert("Failed to copy code");
      });
  };

  return (
    <main className="lobby">
      <div className="panel left">
        <h2>
          Players ({players.length}/{maxPlayers})
        </h2>

        <div className="player-list">
          {players.map((p) => (
            <div
              key={p.name}
              className={`player ${p.yourself ? "yourself" : ""}`}
            >
              <p>{p.name}</p>
              {p.yourself && <p>(you)</p>}
            </div>
          ))}

          {Array.from({ length: maxPlayers - players.length }).map((_, i) => (
            <div key={i} className="player waiting">
              <p>Waiting</p>
            </div>
          ))}
        </div>
      </div>

      <div className="panel right">
        <div className="top">
          <h2>Join code</h2>

          <div className="code-wrapper">
            <p className="code">{joinCode}</p>
            <Button
              variant="tertiary"
              onClick={handleCopy}
              className="copy-btn"
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        <div className="buttons row">
          <Button variant="secondary" className="back" onClick={onBack}>
            Back
          </Button>

          <Button onClick={onStart}>Start</Button>
        </div>
      </div>
    </main>
  );
}
