import React from "react";

interface LobbyProps {
  onStart: () => void;
}

export default function Lobby({ onStart }: LobbyProps) {
  return (
    <div>
      <h2>Lobby</h2>
      <p>Waiting for players...</p>
      <button onClick={onStart}>Start Game</button>
    </div>
  );
}
