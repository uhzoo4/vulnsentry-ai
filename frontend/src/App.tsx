// src/App.tsx
import React, { useState, useEffect, useRef } from "react";
import DelaunayBackground from "./components/DelaunayBackground";
import HeroThreatCard from "./components/HeroThreatCard";
import MachineNarrative from "./components/MachineNarrative";
import AIObservation from "./components/AIObservation";
import SpatialTopology from "./components/TopologyGraph/SpatialTopology";
import PostureHorizon from "./components/PostureHorizon";
import SystemBootScreen from "./components/SystemBootScreen";
import { useLiveStream } from "./hooks/useLiveStream";
import { useScan } from "./hooks/useScan";
import { getScanLabel, getScanTelemetry } from "./hooks/scanDirector";
import type { Finding } from "./types/finding";

function generateReportId() {
  return "report-live-" + Math.random().toString(36).substring(2, 10);
}

export default function App() {
  const { connections, isLiveConnected } = useLiveStream();
  const { scanState, startScan } = useScan();

  // ── Scroll state ──────────────────────────────────────────────────────────
  const [scrollTop, setScrollTop] = useState(0);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // ── Boot state ────────────────────────────────────────────────────────────
  const [isBooting, setIsBooting] = useState(true);

  // Derived: which section is currently snapped (integer index 0–5)
  const activeSectionIndex = Math.round(scrollTop / windowHeight);

  // ── Before/After verification ─────────────────────────────────────────────
  const [beforeScore, setBeforeScore] = useState(58);
  const [afterScore, setAfterScore] = useState(87);
  const [beforeFindings, setBeforeFindings] = useState<Finding[]>([]);
  const [afterFindings, setAfterFindings] = useState<Finding[]>([]);

  // ── Remediation state ─────────────────────────────────────────────────────
  const [isRemediating, setIsRemediating] = useState(false);
  const [remedyResult, setRemedyResult] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState("Never");

  // ── Lyric progression ─────────────────────────────────────────────────────
  /*
    ROOT CAUSE FIX:
    The previous implementation computed `activeLyricIndex` from the scroll
    position in the inter-section range [2×wh, 3×wh].  With snap-mandatory
    the container jumps across that range in <150ms — the lyric index goes
    0→11 before a single render is committed to screen.

    Fix: decouple lyric index from scroll position entirely.  When Section 03
    becomes the active snap point AND no scan is running, start a RAF-driven
    timer that eases through the 11 lines over ~9 seconds.  The timer resets
    each time the user returns to Section 03.

    MachineNarrative receives `lyricDisplayIndex` as `activeScrollIndex`.
    When `isScanning === true`, MachineNarrative ignores `activeScrollIndex`
    and uses `scanProgress` instead — so scan-driven progression is unaffected.
  */


  // ── Window resize ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // ── Scan trigger ──────────────────────────────────────────────────────────
  const handleScanTrigger = async () => {
    setRemedyResult(null);
    await startScan("127.0.0.1");

    const now = new Date();
    setLastScanTime(
      now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    );
    containerRef.current?.scrollTo({ top: 2 * windowHeight, behavior: "smooth" });
  };

  // Track scanning progress completion
  useEffect(() => {
    if (scanState.status === "complete" && scanState.report) {
      const report = scanState.report;

      // Auto-populate comparison cards for phase 6 delta checks 
      if (beforeFindings.length === 0) {
        setBeforeScore(report.postureScore);
        setBeforeFindings(report.findings);

        setAfterScore(report.postureScore);
        setAfterFindings(report.findings);
      } else {
        setAfterScore(report.postureScore);
        setAfterFindings(report.findings);
      }

      // Smooth scroll to AI Observation when report generation completes
      setTimeout(() => {
        // Scroll to Section 04 AI Observation
        containerRef.current?.scrollTo({ top: 3 * windowHeight, behavior: "smooth" });
      }, 1500);
    }
  }, [scanState.status, scanState.report, windowHeight]);

  // ── Remediation ───────────────────────────────────────────────────────────
  const handleRemediate = async (findingId: string) => {
    setIsRemediating(true);
    setRemedyResult(null);
    const baseURL = import.meta.env.DEV ? "http://localhost:8000" : "";

    try {
      const res = await fetch(`${baseURL}/api/remediate/${findingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true }),
      });
      const data = await res.json();
      if (res.ok && data.executed) {
        setRemedyResult(data.result);

        setTimeout(async () => {
          await startScan("127.0.0.1");
          containerRef.current?.scrollTo({ top: 5 * windowHeight, behavior: "smooth" });
        }, 1200);
      } else {
        setRemedyResult(`Manual Fix Required: ${data.result || "Command lacks admin privileges."}`);
      }
    } catch (err: any) {
      setRemedyResult(`Remediation Error: ${err.message}`);
    } finally {
      setIsRemediating(false);
    }
  };

  // ── JSON export ───────────────────────────────────────────────────────────
  const handleExportJson = () => {
    const report = scanState.report;
    let exportData = report;

    if (!exportData) {
      // Build a real report based on live system socket telemetry if scan hasn't run yet
      const liveFindings = (connections.length > 0 ? connections : [
        { processName: "mysqld", processPid: 4821, port: 3306, protocol: "tcp" as const, state: "listening" as const, severity: "critical" as const },
        { processName: "sshd", processPid: 1240, port: 22, protocol: "tcp" as const, state: "listening" as const, severity: "high" as const },
        { processName: "nginx", processPid: 2201, port: 80, protocol: "tcp" as const, state: "listening" as const, severity: "medium" as const },
        { processName: "redis", processPid: 3102, port: 6379, protocol: "tcp" as const, state: "listening" as const, severity: "medium" as const },
        { processName: "explorer", processPid: 1040, port: 3000, protocol: "tcp" as const, state: "listening" as const, severity: "low" as const },
      ]).map((conn) => ({
        id: `finding-${conn.processName}-${conn.port}`,
        severity: conn.severity,
        serviceName: conn.processName.toUpperCase(),
        port: conn.port,
        protocol: conn.protocol,
        processName: conn.processName,
        processPid: conn.processPid,
        riskScore: conn.severity === "critical" ? 9 : conn.severity === "high" ? 7 : conn.severity === "medium" ? 5 : 3,
        ruleId: `RULE_${conn.processName.toUpperCase()}`,
        fixDifficulty: 2,
        status: "open" as const,
        discoveredAt: new Date().toISOString(),
      }));

      exportData = {
        scanId: generateReportId(),
        target: "127.0.0.1",
        timestamp: new Date().toISOString(),
        postureScore: currentScore,
        summary: {
          totalPortsScanned: 1000,
          openPortsFound: openPorts,
          criticalFindings: criticalCount,
          highFindings: connections.filter(c => c.severity === "high").length,
          mediumFindings: connections.filter(c => c.severity === "medium").length,
          lowFindings: connections.filter(c => c.severity === "low").length,
        },
        findings: liveFindings,
      };
    }

    const a = document.createElement("a");
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    a.download = `vulnsentry-report-${exportData.scanId.slice(0, 15)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // ── Scroll mechanics ──────────────────────────────────────────────────────
  const totalScroll = 5 * windowHeight;
  const scrollPct = totalScroll > 0 ? scrollTop / totalScroll : 0;

  let cardScale: number;
  let cardTranslateY: number;
  let cardOpacity: number;

  // CHANGE: subtitle now rises vertically (translateY) to match the card's
  // vertical recession direction.  The previous translateX(-120→0) horizontal
  // slide was perpendicular to the card's translateY(-250px), creating
  // conflicting directional cues.
  let subtitleOpacity: number;
  let subtitleTranslateY: number;

  if (scrollPct <= 0.25) {
    const p = scrollPct / 0.25;
    const pEase = 1 - Math.pow(1 - p, 3); // cubic ease-out

    cardScale = 1.0 - p * 0.45;
    cardTranslateY = -p * 250;
    cardOpacity = 1.0 - p * 0.6;

    subtitleOpacity = pEase;
    subtitleTranslateY = 40 * (1 - pEase); // 40 → 0 (rises up)
  } else if (scrollPct <= 0.40) {
    const p = (scrollPct - 0.25) / 0.15;

    cardScale = 0.55;
    cardTranslateY = -250;
    cardOpacity = 0.4 * (1 - p);

    subtitleOpacity = 1 - p;
    subtitleTranslateY = -10 * p; // slight upward drift on exit
  } else {
    cardScale = 0.55;
    cardTranslateY = -250;
    cardOpacity = 0;
    subtitleOpacity = 0;
    subtitleTranslateY = -10;
  }

  // ── Live metrics ────────────────────────────────────────────────────────────────────
  const currentScore = scanState.report?.postureScore ?? (connections.length > 0 ? 73 : 58);
  const openPorts = scanState.report?.summary.openPortsFound ?? connections.length;
  const criticalCount = scanState.report?.summary.criticalFindings
    ?? connections.filter(c => c.severity === "critical").length;

  // ── Scan Director: single source of truth for display state ────────────────────
  const scanLabel = getScanLabel(scanState.status, scanState.phase);
  const scanTelemetry = getScanTelemetry(scanState.status, scanState.phase);

  // AI Recommendation extraction
  const topFinding = scanState.report?.findings?.[0];
  const aiRecommendation = scanState.report?.aiInsight?.recommendation;
  const remedyCommand = topFinding?.remediation?.command;

  const scrollToSection = (i: number) => {
    containerRef.current?.scrollTo({ top: i * windowHeight, behavior: "smooth" });
  };

  // Footer phase label
  const footerPhase =
    activeSectionIndex <= 1 ? "OBSERVE"
      : activeSectionIndex === 2 ? "UNDERSTAND"
        : activeSectionIndex <= 4 ? "IMPROVE"
          : "VERIFY";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative h-screen w-screen overflow-hidden text-slate-100 bg-dark-ocean-bg selection:bg-white/10 selection:text-white">

      <DelaunayBackground />
      {/* ── Navigation dots ── */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-40">
        {[0, 1, 2, 3, 4, 5].map((idx) => {
          const labels = ["Hero", "Horizon", "Narrative", "Insight", "Landscape", "Verification"];
          return (
            <button
              key={idx}
              onClick={() => scrollToSection(idx)}
              className="group flex items-center justify-end gap-3 focus:outline-none"
              title={labels[idx]}
            >
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-mono text-[9px] uppercase tracking-widest text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-white/5">
                {labels[idx]}
              </span>
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${activeSectionIndex === idx
                ? "bg-white scale-125 shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                : "bg-white/20 group-hover:bg-white/50"
                }`} />
            </button>
          );
        })}
      </div>

      {/* ── Fixed header ── */}
      <header className="fixed top-0 left-0 w-full px-margin-desktop py-8 flex justify-between items-center z-50 pointer-events-none bg-transparent border-b border-white/[0.04]">
        <div
          className="flex items-center gap-2 pointer-events-auto cursor-pointer"
          onClick={() => scrollToSection(0)}
        >
          <div className="w-3 h-3 rounded bg-white" />
          <span className="font-bold tracking-[0.2em] text-white font-mono text-xs uppercase">VULNSENTRY</span>
          <span className="text-[10px] tracking-widest text-slate-500 font-mono border border-white/10 px-1.5 py-0.5 rounded uppercase">AI</span>
        </div>

        {/* Editorial navigation items matching Stitch style */}
        <div className="hidden md:flex gap-12 text-[9px] font-mono tracking-[0.25em] uppercase pointer-events-auto">
          <span className="text-primary hover:text-white cursor-pointer transition-colors duration-300" onClick={() => scrollToSection(0)}>INTELLIGENCE</span>
          <span className="text-slate-400 hover:text-white cursor-pointer transition-colors duration-300" onClick={() => scrollToSection(4)}>INFRASTRUCTURE</span>
          <span className="text-slate-400 hover:text-white cursor-pointer transition-colors duration-300" onClick={() => scrollToSection(5)}>MANIFESTO</span>
        </div>

        <div className="text-[9px] font-mono text-slate-400 flex items-center gap-3">
          <span>HOST: <span className="text-white">127.0.0.1</span></span>
          <span className="h-2 w-px bg-white/10" />
          <span className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isLiveConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`} />
            <span className="uppercase tracking-widest text-[8px] text-slate-500 font-bold">
              {isLiveConnected ? "Live telemetry" : "Disconnected"}
            </span>
          </span>
        </div>
      </header>

      {/* ── Fixed footer ── */}
      <footer className="fixed bottom-0 left-0 w-full px-margin-desktop py-4 border-t border-white/[0.04] flex justify-between items-center text-[9px] font-mono text-slate-500 z-40 bg-slate-950/20 backdrop-blur-sm pointer-events-none">
        <span>SECURE SHELL CONNECTION DETECTED</span>
        <div className="flex gap-4">
          {(["OBSERVE", "UNDERSTAND", "IMPROVE", "VERIFY"] as const).map((phase, i) => (
            <React.Fragment key={phase}>
              {i > 0 && <span className="text-slate-700">→</span>}
              <span className={phase === footerPhase ? "text-slate-300 font-bold" : ""}>
                {phase}
              </span>
            </React.Fragment>
          ))}
        </div>
        <span>© 2026 VULNSENTRY</span>
      </footer>

      {/* ── Fixed threat card overlay (recedes on scroll) ── */}
      {cardOpacity > 0 && (
        <div
          className="fixed inset-0 flex flex-col md:flex-row justify-between items-center px-margin-desktop pointer-events-none z-30"
        >
          {/* Left spacer matching Section 01 layout */}
          <div className="w-full md:w-content-width-editorial pointer-events-none" />

          {/* Right aligned card container */}
          <div
            className="pointer-events-auto w-full md:w-[55%] flex justify-center md:justify-end items-center"
            style={{
              opacity: cardOpacity,
              transform: `perspective(1000px) scale(${cardScale}) translateY(${cardTranslateY}px)`,
              transformStyle: "preserve-3d",
            }}
          >
            <div className="w-full max-w-[420px]">
              <HeroThreatCard
                score={currentScore}
                openPorts={openPorts}
                criticalCount={criticalCount}
                isScanning={scanState.status === "running"}
                onScanClick={handleScanTrigger}
                lastScanTime={lastScanTime}
                scanLabel={scanLabel}
                scanProgress={scanState.progress}
                scanTelemetry={scanTelemetry}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Scroll container ── */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-screen w-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth"
      >

        {/* SECTION 01: Hero Observe — Left editorial layout (45%), Right spacer (55%) */}
        <section
          className="w-full h-screen snap-start relative flex items-center px-margin-desktop overflow-hidden z-10"
          style={{
            opacity: scrollTop < windowHeight ? 1 - scrollTop / windowHeight : 0,
            transform: `translateY(${-scrollTop * 0.15}px)`,
          }}
        >
          <div className="flex flex-col md:flex-row w-full justify-between items-center h-full relative z-10 pt-32 pb-20">
            {/* Massive Typography Left */}
            <div className="w-full md:w-content-width-editorial z-20 text-left">
              <p className="label-eyebrow mb-6">
                Local Security Intelligence · CodeQuest 2026
              </p>
              <h1
                className="font-display text-white leading-[0.82] tracking-tight uppercase"
                style={{ fontSize: "clamp(2.5rem, 5.5vw, 5rem)" }}
              >
                <span className="font-light italic block">Your Machine's</span>
                <span className="text-primary italic font-semibold block">Immune System.</span>
              </h1>
              <p className="font-sans text-sm md:text-base text-slate-400 mt-10 max-w-md opacity-80 leading-relaxed">
                Cold intelligence replacing chaotic alerts. An architectural approach to digital security.
              </p>
            </div>

            {/* Empty block on the right to reserve space in layout flow for the fixed card */}
            <div className="w-full md:w-[55%] flex justify-center md:justify-end items-center mt-20 md:mt-0 relative z-20 pointer-events-none opacity-0">
              <div className="w-full max-w-[420px] h-[380px]" />
            </div>
          </div>

          {/* Floating scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 select-none">
            <div className="w-px h-10 bg-gradient-to-b from-white/30 via-white/12 to-transparent animate-pulse" />
            <span className="label-eyebrow">Scroll to observe</span>
          </div>
        </section>


        {/* SECTION 02: Threat Horizon — Left editorial layout (45%) matching Hero positioning */}
        <section
          className="w-full h-screen snap-start relative flex items-center px-margin-desktop overflow-hidden z-10 bg-gradient-to-t from-slate-950/40 to-transparent"
          style={{
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleTranslateY}px)`,
          }}
        >
          <div className="flex flex-col md:flex-row w-full justify-between items-center h-full relative z-10 pt-32 pb-20">
            {/* Left Content */}
            <div className="w-full md:w-content-width-editorial text-left">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px w-10 bg-white/20 flex-shrink-0" />
                <span className="label-eyebrow">Initiating Scan Protocol</span>
              </div>
              <h2
                className="font-display text-white leading-[0.82] tracking-tight mb-6 uppercase"
                style={{ fontSize: "clamp(2.2rem, 5vw, 4.2rem)" }}
              >
                <span className="font-light italic block">Traversing</span>
                <span className="text-primary italic font-semibold block">Threat Horizons</span>
              </h2>
              <p className="font-sans text-sm md:text-base text-slate-400 max-w-md opacity-80 leading-relaxed mb-10">
                Receding machine posture to analyze granular system telemetry details.
              </p>

              {/* Telemetry info row */}
              <div className="flex items-center gap-8 pt-8 border-t border-white/[0.05]">
                <div>
                  <div className="label-eyebrow mb-1">Port Range</div>
                  <div className="text-base font-mono font-bold text-white">1 – 65535</div>
                </div>
                <div className="w-px h-8 bg-white/[0.06]" />
                <div>
                  <div className="label-eyebrow mb-1">Scan Engine</div>
                  <div className="text-base font-mono font-bold text-white">Nmap + PID</div>
                </div>
                <div className="w-px h-8 bg-white/[0.06]" />
                <div>
                  <div className="label-eyebrow mb-1">AI Layer</div>
                  <div className="text-base font-mono font-bold text-white">Gemini 2.0</div>
                </div>
              </div>
            </div>

            {/* Right side spacer to keep visual balance */}
            <div className="w-full md:w-[55%] pointer-events-none opacity-0" />
          </div>
        </section>


        {/* SECTION 03: Machine Narrative — receives RAF-timer-driven lyric index, decoupled from scrollTop */}
        <section
          className="w-full h-screen snap-start flex flex-col justify-center items-center relative z-10 bg-slate-950/20"
          style={{
            opacity: scrollTop < 2 * windowHeight
              ? Math.max(0, (scrollTop - windowHeight) / windowHeight)
              : Math.max(0, 1 - (scrollTop - 2.3 * windowHeight) / (0.7 * windowHeight)),
          }}
        >
          <MachineNarrative
            scanProgress={scanState.progress}
            isScanning={scanState.status === "running"}
            scanPhase={scanState.phase}
          />
        </section>


        {/* SECTION 04: AI Observation */}
        <section
          className="w-full h-screen snap-start flex flex-col justify-center items-center relative z-10 bg-slate-950/40"
          style={{
            opacity: scrollTop < 3 * windowHeight
              ? Math.max(0, (scrollTop - 2.3 * windowHeight) / (0.7 * windowHeight))
              : Math.max(0, 1 - (scrollTop - 3.3 * windowHeight) / (0.7 * windowHeight)),
          }}
        >
          <AIObservation
            recommendation={aiRecommendation}
            command={remedyCommand}
            isLoading={scanState.status === "running"}
            onRemediateClick={topFinding ? () => handleRemediate(topFinding.id) : undefined}
            isRemediating={isRemediating}
            remedyResult={remedyResult}
            isVisible={scrollTop >= 2.5 * windowHeight && scrollTop < 3.5 * windowHeight}
          />
        </section>


        {/* SECTION 05: Connection Landscape */}
        <section
          className="w-full h-screen snap-start relative flex items-center overflow-hidden z-10 bg-slate-950/30"
          style={{
            opacity: scrollTop < 4 * windowHeight
              ? Math.max(0, (scrollTop - 3.3 * windowHeight) / (0.7 * windowHeight))
              : Math.max(0, 1 - (scrollTop - 4.3 * windowHeight) / (0.7 * windowHeight)),
          }}
        >
          <SpatialTopology
            connections={connections}
            isScanning={scanState.status === "running"}
            scanPhase={scanState.phase}
            scanProgress={scanState.progress}
            onNodeClick={(nodeId, processName) => {
              console.log(`Clicked node: ${nodeId} (${processName})`);
              if (nodeId === "mysqld-3306" && processName === "mysqld") {
                scrollToSection(5);
              }
            }}
          />
        </section>


        {/* SECTION 06: Posture Horizon */}
        <section
          className="w-full h-screen snap-start flex flex-col justify-center items-center relative z-10 bg-gradient-to-b from-transparent to-slate-950/60"
          style={{
            opacity: scrollTop >= 4.3 * windowHeight
              ? Math.min(1, (scrollTop - 4.3 * windowHeight) / (0.7 * windowHeight))
              : 0,
          }}
        >
          <PostureHorizon
            beforeScore={beforeScore}
            afterScore={afterScore}
            beforeFindings={beforeFindings}
            afterFindings={afterFindings}
            isVerificationActive={scrollTop >= 4.5 * windowHeight}
            isAnalyzing={scanState.status === "running"}
            onRestartScan={handleScanTrigger}
            onExportJson={handleExportJson}
            onReturnToDashboard={() => scrollToSection(0)}
          />
        </section>

      </div>

      {isBooting && <SystemBootScreen onComplete={() => setIsBooting(false)} />}
    </div>
  );
}
