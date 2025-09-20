import { Button } from "components/ui/Button";
import React from "react";

export default function Home() {
  return (
    <main>
      <h1>Welcome to Profaganda!</h1>
      <p>This is your homepage.</p>
    
        <Button onClick={() => alert('Button clicked!')}>
            Click Me
        </Button>
    </main>
  );
}
