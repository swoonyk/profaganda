import { Button } from "components/ui/Button";
import React, { useState } from "react";
import MuteButton from "components/MuteButton";
import Tabs from "components/ui/Tabs";

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
<<<<<<< Updated upstream

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
=======
      {view === "create" && (
        <main>
          <div className="panel yPadding create">
            <h2>Create Game</h2>

            <div className="inner">
              <div className="input">
                <input
                  type="text"
                  placeholder="Enter your name"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
                {error && (
                  <div className="error">
                    <p>{error}</p>
                  </div>
                )}
              </div>

              <Tabs
                tabs={["Mode A", "Mode B"]}
                onTabChange={(i) => console.log("Active tab:", i)}
              />

              <div className="buttons">
                <Button onClick={handleCreate}>
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
                    <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
                  </svg>
                  <span>Start lobby</span>
                </Button>
                <Button
                  onClick={() => {
                    setView("buttons");
                    setName("");
                    setError("");
                  }}
                  variant="secondary"
                >
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
              </div>
>>>>>>> Stashed changes
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
