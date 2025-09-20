// phases/Lobby.tsx
import { Player } from "../gameWindow";

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
