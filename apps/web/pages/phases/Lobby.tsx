import { Button } from "components/ui/Button";
import React, { useState } from "react";
import { useGameState } from "@/lib/useGameState";
import { useGameActions } from "@/lib/useGameActions";
import MuteButton from "components/MuteButton";

type LobbyProps = {
  muted: boolean;
  toggleMute: () => void;
};

export default function Lobby({ muted, toggleMute }: LobbyProps) {
  const { players, partyId, gameMode } = useGameState();
  const { startRound, leaveGame } = useGameActions();
  const [copied, setCopied] = useState(false);
  const maxPlayers = 4;
  const selectedMode = gameMode || "A"; // Get mode from game state

  const handleCopy = () => {
    navigator.clipboard.writeText(partyId || "").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <main className="lobby">
      <MuteButton muted={muted} toggleMute={toggleMute} />

      <div className="panel left">
        <h2 className="player-count">
          Players ({players.length}/{maxPlayers}):
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
              {copied ? (
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
              ) : (
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
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
              )}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </Button>
          </div>
        </div>

        {/* Selected Game Mode Display */}
        <div style={{ textAlign: "center", margin: "16px 0" }}>
          {/* <h3 style={{ fontSize: "18px", color: "#0ad6a1", margin: "0 0 8px 0" }}>
            Selected Mode: {selectedMode}
          </h3> */}
          <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.8)", margin: 0 }}>
            {selectedMode === "A" ? "Guess the Professor" : "Spot the Fake Review"}
          </p>
        </div>

        <div className="buttons row">
          <Button variant="secondary" onClick={leaveGame}>
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
              <path d="M13 9a1 1 0 0 1-1-1V5.061a1 1 0 0 0-1.811-.75l-6.835 6.836a1.207 1.207 0 0 0 0 1.707l6.835 6.835a1 1 0 0 0 1.811-.75V16a1 1 0 0 1 1-1h6a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1z" />
            </svg>
            <span>Back</span>
          </Button>
          <Button onClick={() => startRound(selectedMode)}>
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
              <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"></path>
            </svg>
            <span>Start {selectedMode === "A" ? "Mode A" : "Mode B"}!</span>
          </Button>
        </div>
      </div>
    </main>
  );
}
