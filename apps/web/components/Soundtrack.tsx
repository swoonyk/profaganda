// components/Soundtrack.tsx
import React, { useEffect, useRef } from "react";

type SoundtrackProps = {
  muted: boolean;
};

const Soundtrack: React.FC<SoundtrackProps> = ({ muted }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  // Start playback once on mount
  useEffect(() => {
    const playAudio = async () => {
      if (audioRef.current) {
        audioRef.current.volume = 0.3;
        try {
          await audioRef.current.play();
          console.log("Audio started successfully");
        } catch {
          console.log("Autoplay blocked, waiting for user interaction");
          const onFirstClick = () => {
            audioRef.current?.play();
            window.removeEventListener("click", onFirstClick);
          };
          window.addEventListener("click", onFirstClick);
        }
      }
    };

    playAudio();
  }, []);

  return (
    <audio ref={audioRef} loop muted={muted}>
      <source src="/soundtrack.mp3" type="audio/mpeg" />
      Your browser does not support the audio element.
    </audio>
  );
};

export default Soundtrack;
