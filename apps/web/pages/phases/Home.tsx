import { Button } from "components/ui/Button";
import React, { useState } from "react";

interface HomeProps {
  onStartLobby: (name: string, isHost: boolean, code?: string) => void;
}

export default function Home({ onStartLobby }: HomeProps) {
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
    onStartLobby(name.trim(), true);
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
    onStartLobby(name.trim(), false, code.trim());
  };

  // render the splash buttons
  if (view === "buttons") {
    return (
      <main className="start">
        <div className="panel yPadding">
          <div className="top">
            <h1>Profaganda!</h1>
            <p>Race your friends to guess the right professor!</p>
          </div>

          <div className="inner">
            <div className="buttons">
              <Button onClick={() => setView("create")}>Create Game</Button>
              <Button onClick={() => setView("join")} variant="secondary">
                Join Game
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // render the create form
  if (view === "create") {
    return (
      <main>
        <div className="panel yPadding">
          <div className="inner">
            <h2>Create Game</h2>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="buttons">
              <Button onClick={handleCreate}>Start Lobby</Button>

              <Button
                onClick={() => {
                  setView("buttons");
                  setError("");
                  setName("");
                }}
                variant="secondary"
                className="back"
              >
                Back
              </Button>

              {/* <Button disabled={!name} onClick={() => onStartLobby(name, true)}> */}
            </div>

            {error && <p className="error-text">{error}</p>}
          </div>
        </div>
      </main>
    );
  }

  // render the join form
  if (view === "join") {
    return (
      <main>
        <div className="panel yPadding">
          <div className="inner">
            <h2>Join Game</h2>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Enter game code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />

            <div className="buttons">
              <Button
                // disabled={!name || !code}
                // onClick={() => onStartLobby(name, false, code)}
                onClick={handleJoin}
              >
                Join Lobby
              </Button>

              <Button
                onClick={() => {
                  setView("buttons");
                  setError("");
                  setName("");
                  setCode("");
                }}
                variant="secondary"
                className="back"
              >
                Back
              </Button>
            </div>
            {error && <p className="error-text">{error}</p>}
          </div>
        </div>
      </main>
    );
  }

  return null;
}
