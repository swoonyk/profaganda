import { Button } from "components/ui/Button";
import React, { useState } from "react";

interface HomeProps {
  onStartLobby: (name: string, isHost: boolean, code?: string) => void;
}

export default function Home({ onStartLobby }: HomeProps) {
  const [view, setView] = useState<"buttons" | "create" | "join">("buttons");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  // render the splash buttons
  if (view === "buttons") {
    return (
      <main>
        <h1>Profaganda!</h1>
        <p>Race your friends to guess the right professor!</p>
        <Button onClick={() => setView("create")}>Create Game</Button>
        <Button onClick={() => setView("join")} variant="secondary">
          Join Game
        </Button>
      </main>
    );
  }

  // render the create form
  if (view === "create") {
    return (
      <div className="start">
        <h2>Create Game</h2>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="buttons">
          <Button
            onClick={() => setView("buttons")}
            variant="secondary"
            className="back"
          >
            Back
          </Button>

          <Button disabled={!name} onClick={() => onStartLobby(name, true)}>
            Start Lobby
          </Button>
        </div>
      </div>
    );
  }

  // render the join form
  if (view === "join") {
    return (
      <div className="start">
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
            onClick={() => setView("buttons")}
            variant="secondary"
            className="back"
          >
            Back
          </Button>

          <Button
            disabled={!name || !code}
            onClick={() => onStartLobby(name, false, code)}
          >
            Join Lobby
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
