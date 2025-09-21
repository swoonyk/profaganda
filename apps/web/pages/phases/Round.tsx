import React, { useEffect, useMemo, useRef, useState } from "react";
import { useGameState } from "@/lib/useGameState";
import { useGameActions } from "@/lib/useGameActions";
import MuteButton from "components/MuteButton";

type RoundProps = {
  muted: boolean;
  toggleMute: () => void;
};

export default function Round({ muted, toggleMute }: RoundProps) {
  const {
    phase,
    players,
    roundNumber,
    options = [],
    roundId,
    gameMode,
    gameData,
    roundEndsAt, // if server provides it; otherwise, we fallback to local 30s
  } = useGameState();

  const { submitAnswer } = useGameActions();

  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [selected, setSelected] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const endedRef = useRef(false);

  useEffect(() => {
    console.log("Round:mount", { phase, roundId, gameMode });
    return () => console.log("Round:unmount");
  }, []);

  // Are hasAnswered flags present from server?
  const hasFlags = useMemo(
    () => players.some((p: any) => typeof p?.hasAnswered === "boolean"),
    [players]
  );

  const answeredCount = useMemo(
    () => (hasFlags ? players.filter((p: any) => p?.hasAnswered).length : 0),
    [players, hasFlags]
  );

  const allAnswered = useMemo(
    () => (hasFlags ? players.length > 0 && players.every((p: any) => p.hasAnswered) : false),
    [players, hasFlags]
  );

  // Reset per round
  useEffect(() => {
    endedRef.current = false;
    setIsLocked(false);
    setSelected(null);
    if (!roundEndsAt) setTimeLeft(30);
    console.log("Round:reset", { roundId, roundNumber, roundEndsAt });
  }, [roundId, roundNumber, roundEndsAt]);

  // Timer: prefer server's authoritative end time; fallback to local countdown
  useEffect(() => {
    let interval: number | undefined;
    if (phase !== "round") return;

    if (roundEndsAt) {
      const compute = () => Math.max(0, Math.ceil((new Date(roundEndsAt).getTime() - Date.now()) / 1000));
      const tick = () => {
        const t = compute();
        setTimeLeft(t);
        if (t <= 0) {
          clearInterval(interval);
          lock("time");
        }
      };
      setTimeLeft(compute());
      interval = window.setInterval(tick, 250);
    } else {
      // local fallback
      interval = window.setInterval(() => {
        setTimeLeft((prev) => {
          const next = Math.max(0, prev - 1);
          if (next <= 0) {
            clearInterval(interval);
            lock("time");
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundEndsAt, phase]);

  // Lock early if all players have answered
  useEffect(() => {
    if (allAnswered) lock("all-answered");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allAnswered]);

  function lock(reason: "time" | "all-answered") {
    if (endedRef.current) return;
    endedRef.current = true;
    setIsLocked(true);
    console.log("Round:lock", { reason });
    // Do not change phase here; server will emit server:round_results -> useGameState moves to leaderboard
  }

  function onSelect(opt: string) {
    if (phase !== "round" || isLocked || timeLeft <= 0) return;
    setSelected(opt);   // local feedback; allow changes until locked
    submitAnswer(opt);  // server should set hasAnswered=true and broadcast via server:players_update
  }

  const canSelect = phase === "round" && !isLocked && timeLeft > 0 && !allAnswered;

  // Try multiple keys for prompt text (adjust to your gameData shape)
  const questionText =
    gameData?.reviewText ??
    gameData?.question ??
    gameData?.prompt ??
    gameData?.text ??
    "";

  const waitingForData = phase === "round" && (!options || options.length === 0) && !questionText;

  return (
    <div className="round">
      <MuteButton muted={muted} toggleMute={toggleMute} />

      <div className="header">
        <p>Time left: {timeLeft} secs</p>
        <p>Question {roundNumber} / 5</p>
        <p style={{ fontSize: 12, color: "#ffff" }}>
          Players: {players.length}
          {hasFlags ? ` • ${answeredCount}/${players.length} answered` : ""}
        </p>
      </div>

      {waitingForData ? (
        <div style={{ padding: 16 }}>
          <h3>Waiting for round data…</h3>
          <p>We started the round, but haven’t received the question/options yet.</p>
          <p style={{ fontSize: 12, opacity: 0.8 }}>
            If this persists, check that the server emits <code>server:round_started</code> with
            <code>{`{ roundId, options, mode, gameData, roundEndsAt? }`}</code> to the party room.
          </p>
        </div>
      ) : (
        <>
          <div className="panel">
            <p>{questionText}</p>
          </div>

          <ul className="options-grid">
            {options.map((opt: string, i: number) => {
              const isSelected = selected === opt;
              return (
                <li key={`${i}-${opt}`}>
                  <button
                    type="button"
                    onClick={() => onSelect(opt)}
                    disabled={!canSelect}
                    className={[
                      "option",
                      isSelected ? "selected" : "",
                      !canSelect ? "disabled" : "",
                    ].join(" ")}
                    aria-pressed={isSelected}
                  >
                    {opt}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div className="footer">
        {canSelect && selected && <p>Answer chosen. You can change it until time runs out.</p>}
        {!canSelect && (timeLeft <= 0 || allAnswered) && <p>Time’s up! Waiting for results…</p>}
      </div>
    </div>
  );
}
