import React from "react";
import { useGameState } from "@/lib/useGameState";
import { useGameActions } from "@/lib/useGameActions";
import MuteButton from "components/MuteButton";
import { Button } from "components/ui/Button";

type EndProps = {
  muted: boolean;
  toggleMute: () => void;
};

export default function End({ muted, toggleMute }: EndProps) {
  const { leaveGame } = useGameActions();

  // Fake data for testing
  const players = [
    { name: "Alice", points: 120 },
    { name: "Bob", points: 90 },
    { name: "Charlie", points: 150 },
    { name: "Esperanza", points: 110, yourself: true },
  ];

  if (!players.length) return <div>No players found.</div>;

  // Sort players descending by points
  const sortedPlayers = [...players].sort((a, b) => b.points - a.points);

  const podiumPlayers = sortedPlayers.slice(0, 3); // Top 3

  return (
    <div className="end">
      <MuteButton muted={muted} toggleMute={toggleMute} />

      <h2>Game Over!</h2>
      <div className="podium">
        {podiumPlayers.map((p, idx) => (
          <div
            key={p.name}
            className={`podium-step step-${idx + 1} ${
              p.yourself ? "yourself" : ""
            }`}
          >
            <div className="player-name">{p.name}</div>
            <div className="player-points">{p.points}</div>
            <div className="podium-base">{idx + 1}</div>
          </div>
        ))}
      </div>

      <h3>All Scores:</h3>
      <ul>
        {players.map((p) => (
          <li key={p.name}>
            <p>
              {p.name} {p.yourself && "(you)"}
            </p>

            <p className="pts">{p.points}</p>
          </li>
        ))}
      </ul>

      <Button onClick={leaveGame} className="home">
        Back to Home
      </Button>
    </div>
  );
}
