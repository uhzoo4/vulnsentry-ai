import React, { useState, useEffect, useRef } from "react";
import DelaunayBackground from "./components/DelaunayBackground";
import HeroThreatCard from "./components/HeroThreatCard";
import MachineNarrative from "./components/MachineNarrative";
import AIObservation from "./components/AIObservation";
import TopologyMap from "./components/TopologyGraph/TopologyMap";
import PostureHorizon from "./components/PostureHorizon";
import { useLiveStream } from "./hooks/useLiveStream";
import { useScan } from "./hooks/useScan";
import type { Finding } from "./types/finding";

export default function App() {
  const { connections, isLiveConnected } = useLiveStream();
  const { scanState, startScan } = useScan();

  // Scroll and layout calculations
  const [scrollTop, setScrollTop] = useState(0);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Before/after verification state tracking
  const [beforeScore, setBeforeScore] = useState(58);
  const [afterScore, setAfterScore] = useState(87);
  const [beforeFindings, setBeforeFindings] = useState<Finding[]>([]);
  const [afterFindings, setAfterFindings] = useState<Finding[]>([]);

  // Remediation triggers
  const [isRemediating, setIsRemediating] = useState(false);
  const [remedyResult, setRemedyResult] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState("Never");

  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Triggering scans
  const handleScanTrigger = async () => {
    setRemedyResult(null);
    await startScan("127.0.0.1");
    
    const now = new Date();
    setLastScanTime(
      now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    );

    // Cinematic scroll snap down to telemetry narrative on scan launch
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 2 * windowHeight,
        behavior: "smooth"
      });
    }
  };

  // Track scanning progress completion
  useEffect(() => {
    if (scanState.status === "complete" && scanState.report) {
      const report = scanState.report;
      
      // Auto-populate comparison cards for Phase 6 delta checks
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
        if (containerRef.current) {
          containerRef.current.scrollTo({
            top: 3 * windowHeight,
            behavior: "smooth"
          });
        }
      }, 1500);
    }
  }, [scanState.status, scanState.report, windowHeight]);

  // Apply automated local remediation
  const handleRemediate = async (findingId: string) => {
    setIsRemediating(true);
    setRemedyResult(null);
    const baseURL = import.meta.env.DEV ? "http://localhost:8000" : "";
    
    try {
      const response = await fetch(`${baseURL}/api/remediate/${findingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true }),
      });
      const data = await response.json();
      
      if (response.ok && data.executed) {
        setRemedyResult(data.result);
        
        // Auto trigger full re-scan after applying fix to verify changes
        setTimeout(async () => {
          await startScan("127.0.0.1");
          // Smooth scroll to the Posture Horizon verification step
          if (containerRef.current) {
            containerRef.current.scrollTo({
              top: 5 * windowHeight,
              behavior: "smooth"
            });
          }
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

  // JSON report export
  const handleExportJson = () => {
    const report = scanState.report;
    if (!report) return;

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `vulnsentry-report-${report.scanId.slice(0,8)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Scroll interpolation formulas for Section 02 recede effects
  let cardScale = 1.0;
  let cardTranslateZ = 0;
  let cardOpacity = 1.0;

  if (scrollTop <= windowHeight) {
    // Scroll progress from Section 01 to Section 02
    const p = scrollTop / windowHeight;
    cardScale = 1.0 - p * 0.65; // goes from 1.0 to 0.35
    cardTranslateZ = -p * 400; // goes from 0px to -400px
    cardOpacity = 1.0;
  } else if (scrollTop <= 2 * windowHeight) {
    // Scroll progress from Section 02 to Section 03
    const p = (scrollTop - windowHeight) / windowHeight;
    cardScale = 0.35;
    cardTranslateZ = -400;
    cardOpacity = 1.0 - p; // fades out completely by Section 03
  } else {
    cardScale = 0.35;
    cardTranslateZ = -400;
    cardOpacity = 0;
  }

  // Active Spotify index in Section 03
  let activeLyricIndex = 0;
  if (scrollTop >= 2 * windowHeight && scrollTop < 3 * windowHeight) {
    const sec3Progress = (scrollTop - 2 * windowHeight) / windowHeight;
    activeLyricIndex = Math.max(0, Math.min(11, Math.floor(sec3Progress * 12)));
  }

  // Compute live threat metrics
  const currentScore = scanState.report?.postureScore ?? (connections.length > 0 ? 73 : 58);
  const openPorts = scanState.report?.summary.openPortsFound ?? connections.length;
  const criticalCount = scanState.report?.summary.criticalFindings ?? connections.filter(c => c.severity === "critical").length;

  // AI Recommendation extraction
  const topFinding = scanState.report?.findings?.[0];
  const aiRecommendation = scanState.report?.aiInsight?.recommendation;
  const remedyCommand = topFinding?.remediation?.command;

  // Jump to specific scroll section helper
  const scrollToSection = (sectionIndex: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: sectionIndex * windowHeight,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden text-slate-100 bg-dark-ocean-bg selection:bg-white/10 selection:text-white">
      
      {/* Cinematic Delaunay tri-mesh canvas background */}
      <DelaunayBackground />

      {/* Floating dot navigation menu (Apple storytelling style) */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-40">
        {[0, 1, 2, 3, 4, 5].map((idx) => {
          const isActive = Math.round(scrollTop / windowHeight) === idx;
          const sectionNames = ["Hero", "Horizon", "Narrative", "Insight", "Landscape", "Verification"];
          return (
            <button
              key={idx}
              onClick={() => scrollToSection(idx)}
              className="group flex items-center justify-end gap-3 relative focus:outline-none"
              title={sectionNames[idx]}
            >
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-mono text-[9px] uppercase tracking-widest text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-white/5">
                {sectionNames[idx]}
              </span>
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                isActive ? "bg-white scale-125 shadow-[0_0_8px_rgba(255,255,255,0.6)]" : "bg-white/20 group-hover:bg-white/50"
              }`} />
            </button>
          );
        })}
      </div>

      {/* Fixed Header */}
      <header className="fixed top-0 left-0 w-full px-8 py-6 flex justify-between items-center z-40 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto cursor-pointer" onClick={() => scrollToSection(0)}>
          <div className="w-3 h-3 rounded bg-white" />
          <span className="font-bold tracking-tight text-white font-display text-lg">
            VULNSENTRY
          </span>
          <span className="text-[10px] tracking-widest text-slate-500 font-mono font-medium border border-white/10 px-1.5 py-0.5 rounded uppercase">
            AI
          </span>
        </div>
        <div className="text-xs font-mono text-slate-400 flex items-center gap-3">
          <span>HOST: <span className="text-white">127.0.0.1</span></span>
          <span className="h-2 w-px bg-white/10" />
          <span className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isLiveConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`} />
            <span className="uppercase tracking-widest text-[9px] text-slate-500 font-bold">
              {isLiveConnected ? "Live telemetry" : "Disconnected"}
            </span>
          </span>
        </div>
      </header>

      {/* Fixed Footer */}
      <footer className="fixed bottom-0 left-0 w-full px-8 py-4 border-t border-white/[0.03] flex justify-between items-center text-[10px] font-mono text-slate-500 z-40 bg-slate-950/10 backdrop-blur-sm pointer-events-none">
        <div>
          <span>SECURE SHELL CONNECTION DETECTED</span>
        </div>
        <div className="flex gap-4">
          <span className={scrollTop < 2 * windowHeight ? "text-slate-300 font-bold" : ""}>OBSERVE</span>
          <span>→</span>
          <span className={scrollTop >= 2 * windowHeight && scrollTop < 3 * windowHeight ? "text-slate-300 font-bold" : ""}>UNDERSTAND</span>
          <span>→</span>
          <span className={scrollTop >= 3 * windowHeight && scrollTop < 5 * windowHeight ? "text-slate-300 font-bold" : ""}>IMPROVE</span>
          <span>→</span>
          <span className={scrollTop >= 5 * windowHeight ? "text-slate-300 font-bold" : ""}>VERIFY</span>
        </div>
        <div>
          <span>© 2026 VULNSENTRY</span>
        </div>
      </footer>

      {/* Receding Threat Card Fixed Overlay */}
      {cardOpacity > 0 && (
        <div
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-30 transition-all duration-100"
          style={{
            opacity: cardOpacity,
            transform: `perspective(1000px) scale(${cardScale}) translate3d(0, 0, ${cardTranslateZ}px)`,
            transformStyle: "preserve-3d"
          }}
        >
          <div className="pointer-events-auto w-full max-w-md px-4">
            <HeroThreatCard
              score={currentScore}
              openPorts={openPorts}
              criticalCount={criticalCount}
              isScanning={scanState.status === "running"}
              onScanClick={handleScanTrigger}
              lastScanTime={lastScanTime}
            />
          </div>
        </div>
      )}

      {/* Scrollable snapped container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-screen w-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth"
      >
        
        {/* SECTION 01: Threat Card Hero */}
        <section className="w-full h-screen snap-start flex flex-col justify-center items-center relative z-10">
          <div className="text-center mb-60 max-w-xl px-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gradient mb-4">
              Your Machine's Immune System.
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Passive connection mapping and predictive intelligence protecting your environment from local service exposures.
            </p>
          </div>
        </section>

        {/* SECTION 02: Threat Horizon */}
        <section className="w-full h-screen snap-start flex flex-col justify-center items-center relative z-10 bg-gradient-to-t from-slate-950/40 to-transparent">
          <div className="text-center mt-60 max-w-lg px-6">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-2 font-display">
              Traversing Threat Horizons
            </h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed font-mono">
              Receding machine posture to analyze granular system telemetry details.
            </p>
          </div>
        </section>

        {/* SECTION 03: Machine Narrative */}
        <section className="w-full h-screen snap-start flex flex-col justify-center items-center relative z-10 bg-slate-950/20">
          <MachineNarrative
            scanProgress={scanState.progress}
            isScanning={scanState.status === "running"}
            activeScrollIndex={activeLyricIndex}
          />
        </section>

        {/* SECTION 04: AI Observation */}
        <section className="w-full h-screen snap-start flex flex-col justify-center items-center relative z-10 bg-slate-950/40">
          <AIObservation
            recommendation={aiRecommendation}
            command={remedyCommand}
            isLoading={scanState.status === "running"}
            onRemediateClick={topFinding ? () => handleRemediate(topFinding.id) : undefined}
            isRemediating={isRemediating}
            remedyResult={remedyResult}
          />
        </section>

        {/* SECTION 05: Connection Landscape */}
        <section className="w-full h-screen snap-start flex flex-col justify-center items-center relative z-10 bg-slate-950/30">
          <TopologyMap
            connections={connections}
            onNodeClick={(nodeId, processName) => {
              // Node click details trigger
              console.log(`Clicked node: ${nodeId} (${processName})`);
            }}
          />
        </section>

        {/* SECTION 06: Posture Horizon */}
        <section className="w-full h-screen snap-start flex flex-col justify-center items-center relative z-10 bg-gradient-to-b from-transparent to-slate-950/60">
          <PostureHorizon
            beforeScore={beforeScore}
            afterScore={afterScore}
            beforeFindings={beforeFindings}
            afterFindings={afterFindings}
            isVerificationActive={scrollTop >= 5 * windowHeight - 100}
            onRestartScan={handleScanTrigger}
            onExportJson={handleExportJson}
            onReturnToDashboard={() => scrollToSection(0)}
          />
        </section>

      </div>

    </div>
  );
}
