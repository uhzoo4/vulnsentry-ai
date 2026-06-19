import { useState } from "react";

interface AIObservationProps {
  recommendation?: string;
  command?: string;
  isLoading?: boolean;
  onRemediateClick?: () => void;
  isRemediating?: boolean;
  remedyResult?: string | null;
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
}: AIObservationProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12 select-none">
      {/* Editorial Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Big Asymmetrical Title (4 cols) */}
        <div className="md:col-span-4 flex flex-col justify-between h-full border-t-2 border-white/20 pt-6">
          <div>
            <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Section 04 // intelligence</p>
            <h2 className="text-4xl md:text-5xl font-black font-display text-white mt-4 leading-none tracking-tight">
              AI<br />Observation
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-8 leading-relaxed">
            CRITICAL ADVISORY // LEVEL 01 EXPOSURE REPORT
          </p>
        </div>

        {/* Right Column: Briefing Paper Card (8 cols) */}
        <div className="md:col-span-8 glass-panel rounded-2xl p-8 md:p-10 border border-white/[0.04] relative overflow-hidden">
          
          {/* Subtle design watermark */}
          <div className="absolute top-0 right-0 w-24 h-24 border-b border-l border-white/[0.02] pointer-events-none" />

          {isLoading ? (
            <div className="flex flex-col gap-4 py-8">
              <div className="h-4 bg-white/5 rounded w-1/3 animate-pulse" />
              <div className="h-6 bg-white/5 rounded w-full animate-pulse" />
              <div className="h-6 bg-white/5 rounded w-4/5 animate-pulse" />
              <div className="h-6 bg-white/5 rounded w-5/6 animate-pulse" />
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              
              {/* Journal-style Header Info */}
              <div className="flex justify-between items-center border-b border-white/[0.08] pb-6">
                <div>
                  <span className="text-[10px] font-mono text-rose-500 uppercase tracking-widest">Active Threat Highlight</span>
                  <h4 className="text-lg font-bold text-white tracking-tight mt-1 font-display">
                    Local Socket Exposures Detected
                  </h4>
                </div>
                <div className="text-right font-mono text-[9px] text-slate-500">
                  <span>SYSTEM ANALYTICS // VERB: REMEDIATE</span>
                </div>
              </div>

              {/* Recommendation Paragraph */}
              <blockquote className="border-l-2 border-rose-500/40 pl-6 my-2">
                <p className="text-base md:text-lg text-slate-200 leading-relaxed font-display font-light italic">
                  "{recommendation}"
                </p>
              </blockquote>

              {/* Action-Oriented Command Panel */}
              <div className="mt-4 p-6 rounded-xl bg-slate-950/50 border border-white/[0.03]">
                <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-3">
                  Recommended Immediate Fix Command
                </span>
                
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  {/* Command String (Monospace) */}
                  <code className="flex-1 bg-black/40 border border-white/5 px-4 py-3.5 rounded-lg text-rose-400 font-mono text-sm overflow-x-auto whitespace-nowrap scrollbar-thin">
                    {command}
                  </code>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {/* Copy Button */}
                    <button
                      onClick={handleCopy}
                      className="px-4 py-3 rounded-lg font-mono text-xs font-semibold bg-white/[0.03] hover:bg-white/[0.08] text-white border border-white/10 transition-all duration-200 flex items-center justify-center gap-1.5 min-w-[90px]"
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
                        className={`px-5 py-3 rounded-lg text-xs font-bold transition-all duration-300 border ${
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
                  <div className="mt-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs animate-fadeIn">
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
