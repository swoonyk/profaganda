import { Button } from "components/ui/Button";
import React from "react";

export default function Home() {
  return (
    <main>
      <h1>Profaganda!</h1>
      <p>
        Guess which Cornell prof matches the review. Race your friends to the
        right answer!
      </p>

      <Button variant="primary" onClick={() => alert("This will join game!")}>
        Join game
      </Button>

      <Button
        variant="secondary"
        onClick={() => alert("THis will create game!")}
      >
        Create game
      </Button>
    </main>
  );
}
