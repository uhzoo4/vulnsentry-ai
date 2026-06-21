import { useState } from "react";
import LoadingSkeleton from "./LoadingSkeleton";

interface AIObservationProps {
  recommendation?: string;
  command?: string;
  isLoading?: boolean;
  onRemediateClick?: () => void;
  isRemediating?: boolean;
  remedyResult?: string | null;
  isVisible?: boolean;
}

const DEFAULT_RECOMMENDATION = 
  "An exposed database service on port 3306 presents an immediate system threat. Any local process or malicious script can access, modify, or erase application tables without authentication. Resolving this issue immediately closes 80% of your current local service attack vector.";

const DEFAULT_COMMAND = "net stop MySQL";

export default function AIObservation({
  recommendation = DEFAULT_RECOMMENDATION,
  command = DEFAULT_COMMAND,
  isLoading = false,
  onRemediateClick,
  isRemediating = false,
  remedyResult = null,
  isVisible = false,
}: AIObservationProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="w-full max-w-4xl mx-auto px-6 py-12 select-none transition-all duration-1200"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(80px)",
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)"
      }}
    >
      {/* Editorial Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Big Asymmetrical Title (4 cols) */}
        <div className="md:col-span-4 flex flex-col justify-between h-full border-t border-white/10 pt-6 text-left">
          <div>
            <p className="label-eyebrow">Section 04 // intelligence</p>
            <h2 className="text-4xl md:text-5xl font-light font-display text-white mt-4 leading-[0.92] tracking-tight uppercase">
              AI<br />
              <span className="text-primary italic font-semibold">Observation</span>
            </h2>
          </div>
          <p className="label-eyebrow mt-8">
            CRITICAL ADVISORY // LEVEL 01 EXPOSURE
          </p>
        </div>

        {/* Right Column: Briefing Paper Card (8 cols) */}
        <div className="md:col-span-8 glass-panel rounded-2xl p-8 md:p-10 border border-white/[0.04] relative overflow-hidden">
          
          {/* Subtle design watermark */}
          <div className="absolute top-0 right-0 w-24 h-24 border-b border-l border-white/[0.02] pointer-events-none" />

          {isLoading ? (
            <div className="flex flex-col gap-5 py-8">
              <LoadingSkeleton width="30%" height="20px" className="mb-4" />
              <LoadingSkeleton width="100%" height="24px" />
              <LoadingSkeleton width="80%" height="24px" />
              <LoadingSkeleton width="90%" height="24px" />
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              
              {/* Journal-style Header Info */}
              <div className="flex justify-between items-center border-b border-white/[0.08] pb-6 text-left">
                <div>
                  <span className="label-eyebrow text-rose-500">Active Threat Highlight</span>
                  <h4 className="text-lg font-medium text-white tracking-tight mt-1 font-display italic">
                    Local Socket Exposures Detected
                  </h4>
                </div>
                <div className="text-right">
                  <span className="label-eyebrow">REMEDIATE // ACTIVE</span>
                </div>
              </div>

              {/* Recommendation Paragraph */}
              <blockquote 
                className="border-l-2 border-rose-500/40 pl-6 my-2 transition-all duration-1200 text-left"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateX(0)" : "translateX(-60px)",
                  transitionDelay: "0.2s",
                  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)"
                }}
              >
                <p className="text-base md:text-lg text-slate-200 leading-relaxed font-display font-light italic">
                  "{recommendation}"
                </p>
              </blockquote>

              {/* Action-Oriented Command Panel */}
              <div 
                className="mt-4 p-6 rounded-xl bg-slate-950/50 border border-white/[0.03] transition-all duration-1200"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateX(0)" : "translateX(60px)",
                  transitionDelay: "0.4s",
                  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)"
                }}
              >
                <span className="block label-eyebrow text-left mb-3">
                  Recommended Immediate Fix Command
                </span>
                
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  {/* Command String (Monospace) */}
                  <code className="flex-1 bg-black/40 border border-white/5 px-4 py-3.5 rounded-lg text-rose-400 font-mono text-sm overflow-x-auto whitespace-nowrap scrollbar-none text-left">
                    {command}
                  </code>

                  {/* Actions */}
                  <div className="flex gap-2 items-center">
                    {/* Copy Button */}
                    <button
                      onClick={handleCopy}
                      className="px-6 py-3.5 rounded-full font-mono text-[10px] font-bold bg-white/[0.03] hover:bg-white/[0.08] text-white border border-white/10 transition-all duration-300 uppercase tracking-widest flex items-center justify-center gap-1.5 min-w-[90px]"
                    >
                      {copied ? (
                        <>
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>Copied</span>
                        </>
                      ) : (
                        <span>Copy</span>
                      )}
                    </button>

                    {/* Apply Fix Trigger */}
                    {onRemediateClick && (
                      <button
                        onClick={onRemediateClick}
                        disabled={isRemediating}
                        className={`px-6 py-3.5 rounded-full text-[10px] font-bold transition-all duration-300 border uppercase tracking-widest ${
                          isRemediating
                            ? "bg-slate-800 border-white/5 text-slate-500 cursor-not-allowed"
                            : "bg-rose-600 hover:bg-rose-500 border-rose-500/20 text-white shadow-[0_0_15px_rgba(225,29,72,0.2)] hover:shadow-[0_0_20px_rgba(225,29,72,0.3)]"
                        }`}
                      >
                        {isRemediating ? "Remediating..." : "Apply Fix"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Remediation Result message feedback */}
                {remedyResult && (
                  <div className="mt-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs animate-fadeIn text-left">
                    <span className="font-bold">STATUS:</span> {remedyResult}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
