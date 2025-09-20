// phases/Lobby.tsx
// This one should take game code and display it

import { Player } from "pages/GameWindow";

interface LobbyProps {
  players: Player[];
  onStart: () => void;
}

export default function Lobby({ players, onStart }: LobbyProps) {
  return (
    <div>
      <h2>Lobby</h2>
      <ul>
        {players.map((p) => (
          <li key={p.name}>{p.name}</li>
        ))}
      </ul>
      <button onClick={onStart}>Start Round</button>
    </div>
  );
}
