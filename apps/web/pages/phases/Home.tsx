import { Button } from "components/ui/Button";
import React, { useState } from "react";
import MuteButton from "components/MuteButton";
import Tabs from "components/ui/Tabs";

type HomeProps = {
  onStartLobby: (name: string, isHost: boolean, code?: string, mode?: "A" | "B") => void;
  muted: boolean;
  toggleMute: () => void;
};

export default function Home({ onStartLobby, muted, toggleMute }: HomeProps) {
  const [view, setView] = useState<"buttons" | "create" | "join">("buttons");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  
  // Initialize selectedMode from localStorage or default to "A"
  const [selectedMode, setSelectedMode] = useState<"A" | "B">(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("selectedGameMode") as "A" | "B" | null;
      return stored || "A";
    }
    return "A";
  });

  
  console.log("Home - selectedMode:", selectedMode);

  const handleCreate = () => {
    if (!name.trim() || name.trim().length > 13) {
      setError("Name must be nonempty and less than 13 characters.");
      return;
    }
    setError("");
    onStartLobby(name.trim(), true, undefined, selectedMode); // Notify parent to create lobby
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
    onStartLobby(name.trim(), false, code.trim(), selectedMode); // Notify parent to join lobby
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
            <div className="inner">
              <div className="buttons">
                <Button onClick={() => setView("create")}>
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
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                  <span>Create game</span>
                </Button>
                <Button onClick={() => setView("join")} variant="secondary">
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
                    <path d="M18 21a8 8 0 0 0-16 0" />
                    <circle cx="10" cy="8" r="5" />
                    <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
                  </svg>
                  <span>Join game</span>
                </Button>
              </div>
            </div>
          </div>
        </main>
      )}
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

              <div className="buttons">
                <Tabs
                  tabs={["Mode A", "Mode B"]}
                  activeTab={selectedMode === "A" ? 0 : 1}
                  onTabChange={(i) => {
                    const newMode = i === 0 ? "A" : "B";
                    setSelectedMode(newMode);
                    // Immediately update localStorage when mode is changed
                    if (typeof window !== "undefined") {
                      localStorage.setItem("selectedGameMode", newMode);
                    }
                  }}
                />

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
            </div>
          </div>
        </main>
      )}

      {view === "join" && (
        <main className="join">
          <div className="panel yPadding">
            <div className="inner">
              <h2>Join Game</h2>
              <div className="input">
                <input
                  type="text"
                  placeholder="Enter your name"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    name.trim() &&
                    code.trim() &&
                    handleJoin()
                  }
                />
                <input
                  type="text"
                  placeholder="Enter game code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    name.trim() &&
                    code.trim() &&
                    handleJoin()
                  }
                />
                {error && (
                  <div className="error">
                    <p>{error}</p>
                  </div>
                )}
              </div>

              <div className="buttons">
                <Button onClick={handleJoin}>
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
                    <path d="m10 17 5-5-5-5" />
                    <path d="M15 12H3" />
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  </svg>
                  <span>Join lobby</span>
                </Button>
                <Button
                  onClick={() => {
                    setView("buttons");
                    setName("");
                    setCode("");
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
            </div>
          </div>
        </main>
      )}
    </>
  );
}
