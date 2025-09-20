import Button from "components/Button";
import React from "react";

export default function Home() {
  return (
    <main>
      <h1>Welcome to Profaganda!</h1>
      <p>This is your homepage.</p>

      <Button
        variant="primary"
        onClick={() => alert("Primary Button Clicked!")}
      >
        hello World
      </Button>
    </main>
  );
}
