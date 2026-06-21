import React, { useRef, useState, useEffect } from "react";

interface HeroThreatCardProps {
  score: number;
  openPorts: number;
  criticalCount: number;
  isScanning: boolean;
  onScanClick: () => void;
  lastScanTime?: string;
  scanLabel?: string;
  scanProgress?: number;
  scanTelemetry?: string;
}

// ── Parallax depth factors ──
// Higher factor = more displacement = appears closer to the viewer.
// These are pixel multipliers applied to the normalized mouse offset (−1…+1).
const PARALLAX = {
  HEADER: 3,
  LIVE_BADGE: 5,
  SCORE_GAUGE: 12,
  METRIC_CARDS: 8,
  BUTTON: 15,
  LAST_SCAN: 3,
} as const;

// ── Interaction constants ──
const MAX_TILT = 2.5;           // degrees — subtle instrumentation tilt
const HOVER_LIFT = 6;           // px translateZ on hover
const PERSPECTIVE = 1200;       // px — wider frustum, less distortion
const LERP_APPROACH = 0.13;     // ~120ms response to cursor
const LERP_RETURN = 0.09;       // ~180ms return to rest
const GLOW_COLOR = "rgba(255, 255, 255, 0.025)";

export default function HeroThreatCard({
  score = 58,
  openPorts = 3,
  criticalCount = 1,
  isScanning = false,
  onScanClick,
  lastScanTime = "Never",
  scanLabel = "LIVE",
  scanProgress = 0,
  scanTelemetry = "",
}: HeroThreatCardProps) {
  // ── Refs: card shell + glow + 6 parallax layers ──
  const cardRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);

  const headerRef = useRef<HTMLDivElement | null>(null);
  const liveBadgeRef = useRef<HTMLDivElement | null>(null);
  const gaugeRef = useRef<HTMLDivElement | null>(null);
  const metricsRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const lastScanRef = useRef<HTMLParagraphElement | null>(null);

  const [isHovered, setIsHovered] = useState(false);

  // ── Lerp state: card-level tilt ──
  const targetRotX = useRef(0);
  const targetRotY = useRef(0);
  const currentRotX = useRef(0);
  const currentRotY = useRef(0);

  const targetTranslateZ = useRef(0);
  const currentTranslateZ = useRef(0);

  // ── Lerp state: glow spotlight ──
  const targetGlowX = useRef(0);
  const targetGlowY = useRef(0);
  const currentGlowX = useRef(0);
  const currentGlowY = useRef(0);

  // ── Lerp state: normalized mouse offset for parallax layers ──
  // dx/dy are −1…+1 relative to card center
  const targetMouseX = useRef(0);
  const targetMouseY = useRef(0);
  const currentMouseX = useRef(0);
  const currentMouseY = useRef(0);

  const animFrameId = useRef<number | null>(null);

  // ── Animation loop ──
  useEffect(() => {
    const animate = () => {
      const card = cardRef.current;
      const glow = glowRef.current;
      if (!card) return;

      // Select lerp rate: faster on approach, slower on return
      const lerpRate = isHovered ? LERP_APPROACH : LERP_RETURN;

      // 1. Lerp card-level rotation
      currentRotX.current += (targetRotX.current - currentRotX.current) * lerpRate;
      currentRotY.current += (targetRotY.current - currentRotY.current) * lerpRate;
      currentTranslateZ.current += (targetTranslateZ.current - currentTranslateZ.current) * lerpRate;

      // 2. Lerp glow position
      currentGlowX.current += (targetGlowX.current - currentGlowX.current) * lerpRate;
      currentGlowY.current += (targetGlowY.current - currentGlowY.current) * lerpRate;

      // 3. Lerp normalized mouse offset for parallax layers
      currentMouseX.current += (targetMouseX.current - currentMouseX.current) * lerpRate;
      currentMouseY.current += (targetMouseY.current - currentMouseY.current) * lerpRate;

      // 4. Apply card shell transform (no idle float — card is stationary at rest)
      card.style.transform = `perspective(${PERSPECTIVE}px) rotateY(${currentRotY.current}deg) rotateX(${currentRotX.current}deg) translateZ(${currentTranslateZ.current}px)`;

      // 5. Apply per-layer parallax translations
      const mx = currentMouseX.current;
      const my = currentMouseY.current;

      applyParallax(headerRef.current, PARALLAX.HEADER, mx, my);
      applyParallax(liveBadgeRef.current, PARALLAX.LIVE_BADGE, mx, my);
      applyParallax(gaugeRef.current, PARALLAX.SCORE_GAUGE, mx, my);
      applyParallax(metricsRef.current, PARALLAX.METRIC_CARDS, mx, my);
      applyParallax(buttonRef.current, PARALLAX.BUTTON, mx, my);
      applyParallax(lastScanRef.current, PARALLAX.LAST_SCAN, mx, my);

      // 6. Glow spotlight
      if (glow && isHovered) {
        glow.style.background = `radial-gradient(circle 180px at ${currentGlowX.current}px ${currentGlowY.current}px, ${GLOW_COLOR}, transparent 80%)`;
      } else if (glow) {
        glow.style.background = "transparent";
      }

      animFrameId.current = requestAnimationFrame(animate);
    };

    animFrameId.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [isHovered]);

  // ── Parallax helper: applies translate3d to a layer element ──
  function applyParallax(el: HTMLElement | null, factor: number, mx: number, my: number) {
    if (!el) return;
    const tx = mx * factor;
    const ty = my * factor;
    el.style.transform = `translate3d(${tx}px, ${ty}px, 0px)`;
  }

  // ── Mouse handlers ──
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // Normalized −1…+1 offset from card center
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);

    // Card-level tilt targets
    targetRotX.current = -dy * MAX_TILT;
    targetRotY.current = dx * MAX_TILT;
    targetTranslateZ.current = HOVER_LIFT;

    // Glow spotlight coordinates (absolute within card)
    targetGlowX.current = e.clientX - rect.left;
    targetGlowY.current = e.clientY - rect.top;

    // Parallax layer mouse offset targets
    targetMouseX.current = dx;
    targetMouseY.current = dy;
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    targetRotX.current = 0;
    targetRotY.current = 0;
    targetTranslateZ.current = 0;
    targetMouseX.current = 0;
    targetMouseY.current = 0;
  };

  // ── Color threshold helpers ──
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

  // ── Circular progress SVG values ──
  // During scan: gauge shows progress %. After scan: shows posture score.
  const gaugeValue = isScanning ? scanProgress : score;
  const strokeRadius = 70;
  const strokeCircumference = 2 * Math.PI * strokeRadius;
  const strokeOffset = strokeCircumference - (Math.min(gaugeValue, 100) / 100) * strokeCircumference;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="glass-panel relative rounded-3xl p-8 md:p-10 max-w-md w-full mx-auto select-none border border-white/[0.05] overflow-hidden"
      style={{ transformStyle: "preserve-3d", willChange: "transform" }}
    >
      {/* Dynamic hover lighting overlay */}
      <div
        ref={glowRef}
        className="absolute inset-0 pointer-events-none z-10"
        style={{ opacity: isHovered ? 1 : 0, transition: "opacity 180ms linear" }}
      />

      {/* ── LAYER: Header (factor 3) ── */}
      <div ref={headerRef} className="flex justify-between items-center mb-8" style={{ willChange: "transform" }}>
        <div className="text-left">
          <p className="text-xs uppercase tracking-widest text-slate-500 font-mono">Telemetry Active</p>
          <h2 className="text-xl font-bold tracking-tight text-white mt-1">VulnSentry AI</h2>
        </div>

        {/* ── LAYER: Live Badge (factor 5) — text driven by scanDirector ── */}
        <div
          ref={liveBadgeRef}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-colors duration-300 ${
            isScanning
              ? "bg-amber-500/10 border-amber-500/20"
              : "bg-emerald-500/10 border-emerald-500/20"
          }`}
          style={{ willChange: "transform" }}
        >
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            isScanning ? "bg-amber-400" : "bg-emerald-400"
          }`} />
          <span className={`text-[10px] uppercase tracking-wider font-mono transition-colors duration-300 ${
            isScanning ? "text-amber-400" : "text-emerald-400"
          }`}>{scanLabel}</span>
        </div>
      </div>

      {/* ── LAYER: Score Gauge (factor 12) ── */}
      <div ref={gaugeRef} className="flex justify-center items-center my-8 relative" style={{ willChange: "transform" }}>
        <div
          className={`w-44 h-44 rounded-full border flex flex-col justify-center items-center relative bg-slate-950/40 backdrop-blur-md transition-all duration-500 ${
            isScanning ? "border-amber-500/30" : getScoreBorderClass(score)
          }`}
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
              className={`transition-all duration-700 ease-out ${
                isScanning ? "text-amber-400" : getScoreColorClass(score)
              }`}
            />
          </svg>
          <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
            {isScanning ? "Scan Progress" : "Posture Score"}
          </span>
          <span className="text-5xl font-extrabold tracking-tighter text-white mt-1">
            {isScanning ? Math.round(scanProgress) : score}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-1">
            {isScanning ? "%" : "/ 100"}
          </span>
          {/* Scan telemetry sub-text */}
          {scanTelemetry && (
            <span className="absolute -bottom-6 text-[8px] font-mono uppercase tracking-[0.25em] text-amber-400/70 transition-opacity duration-300">
              {scanTelemetry}
            </span>
          )}
        </div>
      </div>

      {/* ── LAYER: Metric Cards (factor 8) ── */}
      <div ref={metricsRef} className="grid grid-cols-2 gap-4 mt-6 text-center" style={{ willChange: "transform" }}>
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

      {/* ── LAYER: Button (factor 15 — closest to viewer) ── */}
      <div ref={buttonRef} className="mt-8 text-center" style={{ willChange: "transform" }}>
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

        {/* ── LAYER: Last Scan (factor 3 — barely moves) ── */}
        <p ref={lastScanRef} className="text-[10px] font-mono text-slate-500 mt-3" style={{ willChange: "transform" }}>
          Last Scan: {lastScanTime}
        </p>
      </div>
    </div>
  );
}
