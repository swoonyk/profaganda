import React, { useEffect, useState } from "react";
import { Button } from "components/ui/Button";
import { useGameState } from "@/lib/useGameState";
import { useGameActions } from "@/lib/useGameActions";
import MuteButton from "components/MuteButton";
import { GameMode2Response } from "../../src/shared/types";

type RoundMode2Props = {
  muted: boolean;
  toggleMute: () => void;
  gameData?: GameMode2Response;
};

export default function RoundMode2({ muted, toggleMute, gameData }: RoundMode2Props) {
  const { players, roundNumber } = useGameState();
  const { submitAnswer } = useGameActions();
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAnswerClick = (answer: "real" | "ai") => {
    if (selectedAnswer) return; // Prevent multiple selections
    
    setSelectedAnswer(answer);
    submitAnswer(answer);
  };

  return (
    <div className="round">
      <MuteButton muted={muted} toggleMute={toggleMute} />

      <div className="header">
        <p>Time left: {timeLeft} secs</p>
        <p>Question {roundNumber} / 5</p>
      </div>

      <div className="scoreboard">
        {players.map((p) => (
          <p key={p.name}>
            {p.name}: {p.points} {p.yourself && "(you)"}
          </p>
        ))}
      </div>

      {/* Professor info header */}
      <div style={{ 
        textAlign: "center", 
        margin: "16px 0", 
        padding: "16px", 
        background: "rgba(255, 255, 255, 0.1)", 
        borderRadius: "16px", 
        border: "2px solid rgba(255, 255, 255, 0.15)" 
      }}>
        <h3 style={{ fontSize: "28px", marginBottom: "8px", color: "#fff" }}>
          Professor: {gameData?.professor?.name || "Loading..."}
        </h3>
        <p style={{ fontSize: "18px", color: "rgba(255, 255, 255, 0.8)", margin: 0 }}>
          {gameData?.professor?.department && `${gameData.professor.department} • `}
          {gameData?.professor?.school || "Loading..."}
        </p>
        {gameData?.professor?.average_satisfaction && (
          <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)", margin: "4px 0 0 0" }}>
            Average Rating: {gameData.professor.average_satisfaction.toFixed(1)}/5.0
            {gameData.professor.total_reviews && ` (${gameData.professor.total_reviews} reviews)`}
          </p>
        )}
      </div>

      {/* Review text panel */}
      <div className="panel">
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <h4 style={{ fontSize: "20px", color: "#0ad6a1", marginBottom: "16px" }}>
            Student Review:
          </h4>
        </div>
        <p style={{ fontSize: "18px", lineHeight: "1.6", textAlign: "center" }}>
          {gameData?.review?.sanitized_text || "Loading review..."}
        </p>
        {gameData?.review?.rating && (
          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <span style={{ 
              fontSize: "16px", 
              color: "rgba(255, 255, 255, 0.7)",
              background: "rgba(255, 255, 255, 0.1)",
              padding: "6px 12px",
              borderRadius: "20px"
            }}>
              Rating: {gameData.review.rating}/5
            </span>
          </div>
        )}
      </div>

      {/* Answer options */}
      <div style={{ textAlign: "center", margin: "24px 0" }}>
        <h4 style={{ fontSize: "24px", marginBottom: "24px", color: "#fff" }}>
          Is this review real or AI-generated?
        </h4>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 1fr", 
          gap: "24px", 
          maxWidth: "600px", 
          margin: "0 auto" 
        }}>
          <div 
            className="option"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "24px",
              background: selectedAnswer === "real" 
                ? "rgba(10, 214, 161, 0.2)" 
                : "rgba(255, 255, 255, 0.1)",
              border: selectedAnswer === "real" 
                ? "3px solid #0ad6a1" 
                : "3px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "16px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              minHeight: "140px",
              justifyContent: "center",
              gap: "8px"
            }}
            onClick={() => handleAnswerClick("real")}
          >
            <div style={{ 
              width: "48px", 
              height: "48px", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              background: "rgba(255, 255, 255, 0.1)", 
              borderRadius: "50%", 
              marginBottom: "8px" 
            }}>
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
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <span style={{ fontSize: "20px", fontWeight: "500", color: "#fff" }}>
              Real Review
            </span>
            <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.7)", margin: 0, textAlign: "center" }}>
              Written by a real student
            </p>
          </div>
          
          <div 
            className="option"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "24px",
              background: selectedAnswer === "ai" 
                ? "rgba(10, 214, 161, 0.2)" 
                : "rgba(255, 255, 255, 0.1)",
              border: selectedAnswer === "ai" 
                ? "3px solid #0ad6a1" 
                : "3px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "16px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              minHeight: "140px",
              justifyContent: "center",
              gap: "8px"
            }}
            onClick={() => handleAnswerClick("ai")}
          >
            <div style={{ 
              width: "48px", 
              height: "48px", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              background: "rgba(255, 255, 255, 0.1)", 
              borderRadius: "50%", 
              marginBottom: "8px" 
            }}>
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
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="6"/>
                <circle cx="12" cy="12" r="2"/>
              </svg>
            </div>
            <span style={{ fontSize: "20px", fontWeight: "500", color: "#fff" }}>
              AI Generated
            </span>
            <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.7)", margin: 0, textAlign: "center" }}>
              Created by artificial intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Results display (for after answer is submitted) */}
      {selectedAnswer && (
        <div style={{ 
          textAlign: "center", 
          marginTop: "24px", 
          padding: "16px", 
          background: "rgba(10, 214, 161, 0.1)", 
          border: "2px solid rgba(10, 214, 161, 0.3)", 
          borderRadius: "12px" 
        }}>
        </div>
      )}
    </div>
  );
}
