import React, { useState } from "react";
import GameWindow from "./gameWindow";
import Soundtrack from "components/Soundtrack";

function App() {
  const [muted, setMuted] = useState(false);

  const toggleMute = () => setMuted((prev) => !prev);

  return (
    <>
      <Soundtrack muted={muted} />

      <GameWindow muted={muted} toggleMute={toggleMute} />
    </>
  );
}

export default App;
