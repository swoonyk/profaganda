import { Button } from "components/ui/Button";
import React, { useState } from "react";
import { useGameActions } from "@/lib/useGameActions";

export default function Home() {
  const { joinGame } = useGameActions();
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
    joinGame(name.trim(), true);
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
    joinGame(name.trim(), false, code.trim());
  };

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

  if (view === "create") {
    return (
      <main>
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
          {error && <p className="error-text">{error}</p>}
        </div>
      </main>
    );
  }

  if (view === "join") {
    return (
      <main>
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
          {error && <p className="error-text">{error}</p>}
        </div>
      </main>
    );
  }

  return null;
}
