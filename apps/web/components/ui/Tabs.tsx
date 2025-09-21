import React, { useState, useEffect, useRef } from "react";

interface TabsProps {
  tabs: string[];
  onTabChange?: (index: number) => void;
}

export default function Tabs({ tabs, onTabChange }: TabsProps) {
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (i: number) => {
    setActive(i);
    if (onTabChange) onTabChange(i);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      setActive((prev) => {
        const next = (prev + 1) % tabs.length;
        onTabChange?.(next);
        return next;
      });
    }
    if (e.key === "ArrowLeft") {
      setActive((prev) => {
        const next = (prev - 1 + tabs.length) % tabs.length;
        onTabChange?.(next);
        return next;
      });
    }
  };

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    node.addEventListener("keydown", handleKeyDown);
    return () => {
      node.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      className="tabs-container"
      ref={containerRef}
      tabIndex={0} // <-- makes div focusable
    >
      {/* Tab buttons */}
      {tabs.map((tab, i) => (
        <button
          aria-hidden
          tabIndex={-1}
          key={i}
          onClick={() => handleClick(i)}
          className={`tab-button ${active === i ? "active" : ""}`}
        >
          {tab}
        </button>
      ))}

      {/* Sliding highlight */}
      <div
        className="tabs-highlight"
        style={{
          width: `${100 / tabs.length}%`,
          transform: `translateX(${active * 96}%)`,
        }}
      />
    </div>
  );
}
