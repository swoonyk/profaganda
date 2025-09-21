import { Button } from "components/ui/Button";
import React from "react";

export default function Lobby() {
  return (
    <main className="lobby">
      <div className="panel left">
        <h2>Players (2/4)</h2>

        <div className="player-list">
          <div className="player yourself">
            <p>clem</p>

            <p>(you)</p>
          </div>

          <div className="player">
            <p>soonwoo</p>
          </div>

          <div className="player waiting">
            <p>Waiting</p>
          </div>

          <div className="player waiting">
            <p>Waiting</p>
          </div>
        </div>
      </div>

      <div className="panel right">
        <div className="top">
          <h2>Join code</h2>

          <p>ABC123</p>
        </div>

        <div className="buttons">
          <Button variant="secondary" className="back">
            Back
          </Button>

          <Button>Start</Button>
        </div>
      </div>
    </main>
  );
}
