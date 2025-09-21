import { Button } from "components/ui/Button";
import React, { useState } from "react";
import { useGameState } from "@/lib/useGameState";
import { useGameActions } from "@/lib/useGameActions";

export default function Lobby() {
  const { players, partyId } = useGameState();
  const { startRound, leaveGame } = useGameActions();
  const [copied, setCopied] = useState(false);
  const maxPlayers = 4;

  const handleCopy = () => {
    navigator.clipboard.writeText(partyId || "").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
            <p className="code">{partyId || "ABC123"}</p>
            <Button variant="tertiary" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        <div className="buttons row">
          <Button variant="secondary" onClick={leaveGame}>
            Back
          </Button>
          <Button onClick={() => startRound("A")}>Start!</Button>
          {/* change this later to take the variable for the round since its definable */}
        </div>
      </div>
    </main>
  );
}
