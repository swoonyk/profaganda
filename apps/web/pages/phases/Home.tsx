import { Button } from "components/ui/Button";
import React, { useState } from "react";
import MuteButton from "components/MuteButton";

type HomeProps = {
  onStartLobby: (name: string, isHost: boolean, code?: string) => void;
  muted: boolean;
  toggleMute: () => void;
};

export default function Home({ onStartLobby, muted, toggleMute }: HomeProps) {
  const [view, setView] = useState<"buttons" | "create" | "join">("buttons");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleCreate = () => {
    if (!name.trim() || name.trim().length > 13) {
      setError("Name must be nonempty and less than 13 characters.");
      return;
    }
    setError("");
    onStartLobby(name.trim(), true); // Notify parent to create lobby
  };

  const handleJoin = () => {
    if (!name.trim() || name.trim().length > 13) {
      setError("Name must be nonempty and less than 13 characters.");
      return;
    }
    if (code.trim().length !== 6) {
      setError("Game code must be 6 characters.");
      return;
    }
    setError("");
    onStartLobby(name.trim(), false, code.trim()); // Notify parent to join lobby
  };

  return (
    <>
      {/* Always render mute button */}
      <MuteButton muted={muted} toggleMute={toggleMute} />

      {view === "buttons" && (
        <main className="start">
          <div className="panel yPadding">
            <div className="top">
              <h1>Profaganda!</h1>
              <p>Race your friends to guess the right professor!</p>
            </div>
            <div className="buttons">
              <Button onClick={() => setView("create")}>Create Game</Button>
              <Button onClick={() => setView("join")} variant="secondary">
                Join Game
              </Button>
            </div>
          </div>
        </main>
      )}

      {view === "create" && (
        <main className="create">
          <div className="panel yPadding">
            <h2>Create Game</h2>
            <input
              type="text"
              placeholder="Enter your name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            {error && <p className="error-text">{error}</p>}
            <div className="buttons">
              <Button onClick={handleCreate}>Start Lobby</Button>
              <Button
                onClick={() => {
                  setView("buttons");
                  setName("");
                  setError("");
                }}
                variant="secondary"
              >
                Back
              </Button>
            </div>
          </div>
        </main>
      )}

      {view === "join" && (
        <main className="join">
          <div className="panel yPadding">
            <h2>Join Game</h2>
            <input
              type="text"
              placeholder="Enter your name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && name.trim() && code.trim() && handleJoin()
              }
            />
            <input
              type="text"
              placeholder="Enter game code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && name.trim() && code.trim() && handleJoin()
              }
            />
            {error && <p className="error-text">{error}</p>}
            <div className="buttons">
              <Button onClick={handleJoin}>Join Lobby</Button>
              <Button
                onClick={() => {
                  setView("buttons");
                  setName("");
                  setCode("");
                  setError("");
                }}
                variant="secondary"
              >
                Back
              </Button>
            </div>
          </div>
        </main>
      )}
    </>
  );
}
