import { useState, useEffect } from "react";
import type { Finding } from "../types/finding";
import LoadingSkeleton from "./LoadingSkeleton";

interface PostureHorizonProps {
  beforeScore?: number;
  afterScore?: number;
  beforeFindings?: Finding[];
  afterFindings?: Finding[];
  isVerificationActive?: boolean;
  isAnalyzing?: boolean;
  onRestartScan?: () => void;
  onExportJson?: () => void;
  onReturnToDashboard?: () => void;
}

export default function PostureHorizon({
  beforeScore = 58,
  afterScore = 87,
  beforeFindings = [],
  afterFindings = [],
  isVerificationActive = false,
  isAnalyzing = false,
  onRestartScan,
  onExportJson,
  onReturnToDashboard,
}: PostureHorizonProps) {
  const [animatedScore, setAnimatedScore] = useState(beforeScore);
  const [showSummary, setShowSummary] = useState(false);

  // Score count-up animation
  useEffect(() => {
    if (!isVerificationActive) {
      setAnimatedScore(beforeScore);
      setShowSummary(false);
      return;
    }

    // Delay start of animation slightly for cinematic feel
    const startTimeout = setTimeout(() => {
      let current = beforeScore;
      const target = afterScore;
      
      if (current >= target) {
        setAnimatedScore(target);
        setShowSummary(true);
        return;
      }

      const timer = setInterval(() => {
        current += 1;
        setAnimatedScore(current);
        
        if (current >= target) {
          clearInterval(timer);
          // Fade in summary shortly after score completes
          setTimeout(() => setShowSummary(true), 400);
        }
      }, 150); // Increment 1 unit per 150ms as approved in blueprint

      return () => clearInterval(timer);
    }, 800);

    return () => clearTimeout(startTimeout);
  }, [isVerificationActive, beforeScore, afterScore]);

  // Find resolved findings
  const resolvedFindings = beforeFindings.filter(
    (bf) => !afterFindings.some((af) => af.id === bf.id) || bf.status === "mitigated"
  );

  // Find remaining findings
  const remainingFindings = afterFindings.filter((f) => f.status === "open");

  // Severity color helpers
  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-12 select-none text-left">
      
      {/* Section Header */}
      <div className="mb-10 text-left border-l border-white/10 pl-4">
        <p className="label-eyebrow">Section 06 // verification</p>
        <h2 className="text-4xl md:text-5xl font-light font-display text-white mt-1 leading-[0.92] tracking-tight uppercase">
          Posture <span className="text-primary italic font-semibold">Horizon</span>
        </h2>
      </div>

      {/* Side-by-Side Comparison Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch mb-12">
        
        {/* Left Column: BEFORE SCAN */}
        <div className="glass-panel rounded-2xl p-6 border border-white/[0.03] opacity-60 bg-white/[0.005]">
          <div className="flex justify-between items-center border-b border-white/[0.06] pb-4 mb-6">
            <span className="text-xs font-mono tracking-widest text-slate-500 uppercase">BEFORE SCAN</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500">SCORE:</span>
              <span className="text-xl font-bold font-mono text-rose-500">{beforeScore}</span>
            </div>
          </div>

          {/* Before Findings List */}
          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2">
            {beforeFindings.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono py-4">No services flagged initially.</p>
            ) : (
              beforeFindings.map((finding) => (
                <div
                  key={finding.id}
                  className="p-3.5 rounded-lg bg-white/[0.01] border border-white/[0.02] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono border ${getSeverityBadgeColor(finding.severity)}`}>
                      {finding.severity.toUpperCase()}
                    </span>
                    <span className="text-xs font-semibold text-slate-300 font-display">
                      {finding.serviceName} <span className="font-mono text-slate-500 font-normal">({finding.port})</span>
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-500">{finding.processName}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: AFTER SCAN */}
        <div className="glass-panel rounded-2xl p-6 border border-white/[0.06] relative bg-white/[0.015] shadow-xl">
          
          <div className="flex justify-between items-center border-b border-white/[0.08] pb-4 mb-6">
            <span className="text-xs font-mono tracking-widest text-slate-300 uppercase">AFTER REMEDIATION</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">SCORE:</span>
              <span className={`text-2xl font-bold font-mono transition-all duration-300 ${
                animatedScore >= 80 ? "text-emerald-400" : animatedScore >= 50 ? "text-amber-400" : "text-rose-500"
              }`}>
                {animatedScore}
              </span>
            </div>
          </div>

          {/* After Findings & Resolved Pulse List */}
          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2">
            
            {isAnalyzing ? (
              <div className="flex flex-col gap-3 py-2">
                <LoadingSkeleton width="100%" height="48px" />
                <LoadingSkeleton width="100%" height="48px" />
                <LoadingSkeleton width="100%" height="48px" />
              </div>
            ) : (
              <>
                {/* Resolved Nodes Pulsing Green and Fading Out */}
                {isVerificationActive && resolvedFindings.map((finding) => (
                  <div
                    key={`res-${finding.id}`}
                    className="p-3.5 rounded-lg border flex items-center justify-between transition-all duration-1000 bg-emerald-950/20 border-emerald-500/30 text-emerald-400 animate-pulse"
                    style={{
                      animationIterationCount: 2,
                      animationDuration: "1.2s",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-[10px] font-bold text-emerald-400">
                        ✓
                      </span>
                      <span className="text-xs font-semibold font-display line-through opacity-60">
                        {finding.serviceName} <span className="font-mono font-normal">({finding.port})</span>
                      </span>
                    </div>
                    <span className="text-xs font-mono opacity-50 uppercase tracking-wider text-[10px]">RESOLVED</span>
                  </div>
                ))}

                {/* Remaining active findings */}
                {remainingFindings.length === 0 && resolvedFindings.length === 0 ? (
                  <div className="py-8 text-center">
                    <span className="text-xs text-slate-400 font-mono block">SYSTEM SECURED</span>
                    <span className="text-[10px] text-slate-600 font-mono mt-1 block">No active security risks exposed.</span>
                  </div>
                ) : (
                  remainingFindings.map((finding) => (
                    <div
                      key={finding.id}
                      className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between hover:border-white/[0.1] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono border ${getSeverityBadgeColor(finding.severity)}`}>
                          {finding.severity.toUpperCase()}
                        </span>
                        <span className="text-xs font-semibold text-slate-200 font-display">
                          {finding.serviceName} <span className="font-mono text-slate-400 font-normal">({finding.port})</span>
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-400">{finding.processName}</span>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>

      </div>

      {/* Transformation Summary (Fades in post score-animation) */}
      <div className={`transition-all duration-700 ease-out transform ${
        showSummary 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}>
        <div className="glass-panel rounded-2xl p-8 border border-emerald-500/10 bg-emerald-950/[0.03] mb-8">
          <h4 className="text-sm font-mono tracking-widest text-emerald-400 uppercase border-b border-white/[0.05] pb-3 mb-6">
            TRANSFORMATION SUMMARY // DEMO VERIFIED
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div>
              <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-500">Score Evolution</span>
              <span className="block text-2xl font-bold text-white mt-1 font-mono">
                {beforeScore} <span className="text-emerald-400 font-light text-xl">→</span> {afterScore}
              </span>
            </div>
            
            <div>
              <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-500">Attack Surface Delta</span>
              <span className="block text-2xl font-bold text-emerald-400 mt-1 font-mono">
                -{Math.round(((resolvedFindings.length) / Math.max(beforeFindings.length, 1)) * 100)}%
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-500">Critical Risks</span>
              <span className="block text-2xl font-bold text-white mt-1 font-mono">
                {beforeFindings.filter(f => f.severity === "critical").length} <span className="text-emerald-400 font-light text-xl">→</span> {remainingFindings.filter(f => f.severity === "critical").length}
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-500">Response Verification</span>
              <span className="block text-2xl font-bold text-white mt-1 font-mono">PASS</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {onReturnToDashboard && (
            <button
              onClick={onReturnToDashboard}
              className="px-6 py-3.5 rounded-full font-mono text-[10px] font-bold bg-white text-slate-950 hover:bg-slate-200 transition-all duration-300 uppercase tracking-widest shadow-[0_0_15px_rgba(255,255,255,0.08)] flex items-center justify-center gap-2"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              <span>Return to Dashboard</span>
            </button>
          )}

          {onExportJson && (
            <button
              onClick={onExportJson}
              className="px-6 py-3.5 rounded-full font-mono text-[10px] font-bold bg-white/[0.02] hover:bg-white/[0.06] text-white border border-white/10 transition-all duration-300 uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export JSON Report</span>
            </button>
          )}

          {onRestartScan && (
            <button
              onClick={onRestartScan}
              className="px-6 py-3.5 rounded-full font-mono text-[10px] font-bold bg-white/[0.02] hover:bg-white/[0.06] text-white border border-white/10 transition-all duration-300 uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              <span>Trigger Full Re-Scan</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
