import { useState, useEffect } from "react";

interface SystemBootScreenProps {
  onComplete: () => void;
}

const SEQUENCE = [
  "INITIALIZING TELEMETRY",
  "LOADING TOPOLOGY",
  "AI SUBSYSTEM ONLINE",
  "MISSION CONTROL READY",
];

export default function SystemBootScreen({ onComplete }: SystemBootScreenProps) {
  const [step, setStep] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Total duration ~2200ms
    const t1 = setTimeout(() => setStep(1), 500);
    const t2 = setTimeout(() => setStep(2), 1000);
    const t3 = setTimeout(() => setStep(3), 1500);
    
    // Start fade out at 1800ms
    const t4 = setTimeout(() => setOpacity(0), 1800);
    
    // Complete and unmount at 2200ms
    const t5 = setTimeout(() => onComplete(), 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-dark-ocean-bg text-slate-100 transition-opacity duration-300 pointer-events-none select-none"
      style={{ opacity }}
    >
      <div className="flex flex-col items-center w-full max-w-md px-6">
        {/* Typography consistent with VulnSentry header */}
        <div className="flex items-center gap-2 mb-10">
          <div className="w-3 h-3 rounded bg-white" />
          <span className="font-bold tracking-[0.2em] text-white font-mono text-sm uppercase">
            VULNSENTRY
          </span>
          <span className="text-[10px] tracking-widest text-slate-500 font-mono border border-white/10 px-1.5 py-0.5 rounded uppercase">
            AI
          </span>
        </div>

        <h1 className="font-display font-light italic text-xl md:text-2xl text-slate-400 tracking-tight uppercase mb-16 text-center">
          Your Machine's <span className="text-primary font-semibold">Immune System</span>
        </h1>

        <div className="w-full">
          <div className="flex justify-between items-end mb-3">
            <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">
              {SEQUENCE[step]}
            </span>
            <span className="font-mono text-[9px] text-slate-600">
              {Math.round(((step + 1) / SEQUENCE.length) * 100)}%
            </span>
          </div>
          <div className="w-full h-1 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300 ease-out"
              style={{ width: `${((step + 1) / SEQUENCE.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
