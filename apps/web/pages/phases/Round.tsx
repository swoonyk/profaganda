import React, { useEffect, useMemo, useRef, useState } from "react";
import { useGameState } from "@/lib/useGameState";
import { useGameActions } from "@/lib/useGameActions";
import MuteButton from "components/MuteButton";

type RoundProps = {
  muted: boolean;
  toggleMute: () => void;
};

/**
 * Mode A: Professor Guessing Game
 * - Shows a review and asks which professor wrote it
 * - Uses real database data from production API with fallback to local mock
 */
export default function Round({ muted, toggleMute }: RoundProps) {
  const {
    phase,
    players,
    roundNumber,
    options = [],
    roundId,
    gameMode,
    gameData,
    loading,
  } = useGameState();

  const { submitAnswer } = useGameActions();

  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [selected, setSelected] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const endedRef = useRef(false);

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
    setTimeLeft(15);
    console.log("Round:reset", { roundId, roundNumber });
  }, [roundId, roundNumber]);

  // Timer: local countdown
  useEffect(() => {
    let interval: number | undefined;
    if (phase !== "round") return;

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

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [phase]);

  // Lock early if all players have answered
  useEffect(() => {
    if (allAnswered) lock("all-answered");
  }, [allAnswered]);

  function lock(reason: "time" | "all-answered") {
    if (endedRef.current) return;
    endedRef.current = true;
    setIsLocked(true);
    console.log("Round:lock", { reason });
  }

  function onSelect(opt: string) {
    if (phase !== "round" || isLocked || timeLeft <= 0) return;
    setSelected(opt);
    submitAnswer(opt);
  }

  const canSelect = phase === "round" && !isLocked && timeLeft > 0 && !allAnswered;

  // Get review text from the real data structure
  const reviewText = gameData?.review?.sanitized_text ?? "Loading review...";
  
  // Get professor options from the real data structure
  const professorOptions = gameData?.professorOptions ?? [];

  // Check if we're waiting for data
  const waitingForData = loading || !gameData || !professorOptions.length;

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

      <div className="scoreboard">
        {players.map((p: any) => (
          <p key={p.playerId || p.name}>
            {p.name}: {p.points} {p.yourself && "(you)"} {hasFlags && p.hasAnswered ? "✓" : ""}
          </p>
        ))}
      </div>

      {waitingForData ? (
        <div style={{ 
          padding: 32, 
          textAlign: "center",
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          margin: "20px auto",
          maxWidth: "500px"
        }}>
          <h3 style={{ color: "#0ad6a1", marginBottom: "16px" }}>Loading Question...</h3>
          <div style={{ 
            width: "40px", 
            height: "40px", 
            border: "4px solid rgba(10, 214, 161, 0.3)", 
            borderTop: "4px solid #0ad6a1", 
            borderRadius: "50%", 
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px"
          }}></div>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: 0 }}>
            {loading ? "Fetching real data from database..." : "Processing question data..."}
          </p>
        </div>
      ) : (
        <>
          {/* Review display panel */}
          <div className="panel">
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <h4 style={{ fontSize: "20px", color: "#0ad6a1", marginBottom: "16px" }}>
                Student Review:
              </h4>
            </div>
            <p style={{ fontSize: "18px", lineHeight: "1.6", textAlign: "center" }}>
              {reviewText}
            </p>
          </div>

          {/* Question prompt */}
          <div style={{ textAlign: "center", margin: "24px 0" }}>
            <h4 style={{ fontSize: "24px", marginBottom: "24px", color: "#fff" }}>
              Which professor wrote this review?
            </h4>
          </div>

          {/* Professor options */}
          <ul className="options-grid" style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr", 
            gap: "16px", 
            listStyle: "none", 
            padding: 0,
            maxWidth: "800px",
            margin: "0 auto" 
          }}>
            {professorOptions.map((professor: any, i: number) => {
              const isSelected = selected === professor._id;
              return (
                <li key={`${i}-${professor._id}`}>
                  <button
                    type="button"
                    onClick={() => onSelect(professor._id)}
                    disabled={!canSelect}
                    style={{
                      width: "100%",
                      padding: "20px",
                      background: isSelected 
                        ? "rgba(10, 214, 161, 0.2)" 
                        : "rgba(255, 255, 255, 0.1)",
                      border: isSelected 
                        ? "3px solid #0ad6a1" 
                        : "3px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: "12px",
                      color: "#fff",
                      cursor: canSelect ? "pointer" : "not-allowed",
                      transition: "all 0.2s ease",
                      textAlign: "left",
                      minHeight: "80px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center"
                    }}
                    className={[
                      "option",
                      isSelected ? "selected" : "",
                      !canSelect ? "disabled" : "",
                    ].join(" ")}
                    aria-pressed={isSelected}
                  >
                    <div style={{ fontSize: "18px", fontWeight: "600", marginBottom: "4px" }}>
                      {professor.name}
                    </div>
                    <div style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.7)" }}>
                      {professor.department && `${professor.department} • `}
                      {professor.school}
                    </div>
                    {professor.average_satisfaction && (
                      <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)", marginTop: "4px" }}>
                        Rating: {professor.average_satisfaction.toFixed(1)}/5.0
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="footer" style={{ textAlign: "center", marginTop: "24px" }}>
            {canSelect && selected && <p>Answer chosen. You can change it until time runs out.</p>}
            {!canSelect && (timeLeft <= 0 || allAnswered) && <p>Time&apos;s up! Waiting for results…</p>}
          </div>
        </>
      )}
    </div>
  );
}