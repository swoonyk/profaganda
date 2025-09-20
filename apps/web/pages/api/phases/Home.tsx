import { Button } from "components/ui/Button";
import React from "react";

interface HomeProps {
  onJoinGame: () => void;
  onCreateGame: () => void;
}

export default function Home({ onJoinGame, onCreateGame }: HomeProps) {
  return (
    <main>
      <h1>Profaganda!</h1>
      <p>
        Guess which Cornell prof matches the review. Race your friends to the
        right answer!
      </p>

      <div className="buttons">
        <Button variant="primary" onClick={onJoinGame}>
          Join game
        </Button>

        <Button variant="secondary" onClick={onCreateGame}>
          Create game
        </Button>
      </div>
    </main>
  );
}
