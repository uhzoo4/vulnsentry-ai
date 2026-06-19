import React, { useRef, useState } from "react";

interface HeroThreatCardProps {
  score: number;
  openPorts: number;
  criticalCount: number;
  isScanning: boolean;
  onScanClick: () => void;
  lastScanTime?: string;
}

export default function HeroThreatCard({
  score = 58,
  openPorts = 3,
  criticalCount = 1,
  isScanning = false,
  onScanClick,
  lastScanTime = "Never",
}: HeroThreatCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // 3D Card Tilt logic matching tools/tilt.js
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    const MAX_TILT = 8; // Max 8 degrees tilt as approved

    // Card transform
    card.style.transform = `perspective(1000px) rotateY(${dx * MAX_TILT}deg) rotateX(${-dy * MAX_TILT}deg) translateZ(8px)`;

    // Move dynamic overlay glow spotlight on the card face
    if (glow) {
      const glowX = e.clientX - rect.left;
      const glowY = e.clientY - rect.top;
      glow.style.background = `radial-gradient(circle 180px at ${glowX}px ${glowY}px, rgba(255, 255, 255, 0.04), transparent 80%)`;
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    const card = cardRef.current;
    if (card) {
      card.style.transition = "transform 100ms ease-out";
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!card) return;

    card.style.transform = "perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0)";
    card.style.transition = "transform 400ms ease";

    if (glow) {
      glow.style.background = "transparent";
    }

    setTimeout(() => {
      if (card) card.style.transition = "";
    }, 400);
  };

  // Color threshold helpers
  const getScoreColorClass = (val: number) => {
    if (val < 50) return "text-risk-critical";
    if (val < 80) return "text-risk-high";
    return "text-risk-low";
  };

  const getScoreBorderClass = (val: number) => {
    if (val < 50) return "border-risk-critical/30 glow-critical";
    if (val < 80) return "border-risk-high/30 glow-high";
    return "border-risk-low/30 glow-low";
  };

  // Calculate circular progress SVG values
  const strokeRadius = 70;
  const strokeCircumference = 2 * Math.PI * strokeRadius;
  const strokeOffset = strokeCircumference - (Math.min(score, 100) / 100) * strokeCircumference;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="glass-panel relative rounded-3xl p-8 md:p-10 max-w-md w-full mx-auto select-none border border-white/[0.05] overflow-hidden transition-all duration-300"
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Dynamic hover lighting overlay */}
      <div
        ref={glowRef}
        className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300"
        style={{ opacity: isHovered ? 1 : 0 }}
      />

      {/* Header Info */}
      <div className="flex justify-between items-center mb-8" style={{ transform: "translateZ(20px)" }}>
        <div className="text-left">
          <p className="text-xs uppercase tracking-widest text-slate-500 font-mono">Telemetry Active</p>
          <h2 className="text-xl font-bold tracking-tight text-white mt-1">VulnSentry AI</h2>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-mono">LIVE</span>
        </div>
      </div>

      {/* Circular Score Gauge */}
      <div className="flex justify-center items-center my-8 relative" style={{ transform: "translateZ(30px)" }}>
        <div
          className={`w-44 h-44 rounded-full border flex flex-col justify-center items-center relative bg-slate-950/40 backdrop-blur-md transition-all duration-500 ${getScoreBorderClass(
            score
          )}`}
        >
          <svg className="absolute w-full h-full -rotate-90 pointer-events-none">
            <circle
              cx="88"
              cy="88"
              r={strokeRadius}
              fill="transparent"
              stroke="rgba(255,255,255,0.02)"
              strokeWidth="4"
            />
            <circle
              cx="88"
              cy="88"
              r={strokeRadius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={strokeCircumference}
              strokeDashoffset={strokeOffset}
              className={`transition-all duration-700 ease-out ${getScoreColorClass(score)}`}
            />
          </svg>
          <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Posture Score</span>
          <span className="text-5xl font-extrabold tracking-tighter text-white mt-1">{score}</span>
          <span className="text-[10px] text-slate-400 font-mono mt-1">/ 100</span>
        </div>
      </div>

      {/* Telemetry Metrics */}
      <div className="grid grid-cols-2 gap-4 mt-6 text-center" style={{ transform: "translateZ(20px)" }}>
        <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.02]">
          <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-500">Exposed Ports</span>
          <span className="block text-2xl font-bold text-white mt-1 font-mono">{openPorts}</span>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.02]">
          <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-500">Critical Risks</span>
          <span
            className={`block text-2xl font-bold mt-1 font-mono ${
              criticalCount > 0 ? "text-risk-critical" : "text-slate-400"
            }`}
          >
            {criticalCount}
          </span>
        </div>
      </div>

      {/* Scan Controller */}
      <div className="mt-8 text-center" style={{ transform: "translateZ(25px)" }}>
        <button
          onClick={onScanClick}
          disabled={isScanning}
          className={`w-full py-4 px-6 rounded-xl font-bold tracking-wide transition-all duration-300 relative overflow-hidden flex justify-center items-center gap-2 ${
            isScanning
              ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
              : "bg-white text-slate-950 hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] border border-white/10"
          }`}
        >
          {isScanning ? (
            <>
              <svg className="animate-spin h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Evaluating system...</span>
            </>
          ) : (
            <span>Run Deep Analysis</span>
          )}
        </button>
        <p className="text-[10px] font-mono text-slate-500 mt-3">
          Last Scan: {lastScanTime}
        </p>
      </div>
    </div>
  );
}
