import { Button } from "components/ui/Button";
import React from "react";
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

          <p>{joinCode}</p>
        </div>

        <div className="buttons">
          <Button variant="secondary" className="back">
            Back
          </Button>

          <Button onClick={onStart}>Start</Button>
        </div>
      </div>
    </main>

    /*
<div>
      <h2>Lobby</h2>
      <ul>
        {players.map((p) => (
          <li key={p.name}>{p.name} {p.isHost ? "(Host)" : ""}</li>
        ))}
      </ul>
      <button onClick={onStart}>Start Game</button>
    </div>
*/
  );
}
