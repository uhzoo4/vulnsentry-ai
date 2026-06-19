import { useRef, useEffect } from "react";

interface MachineNarrativeProps {
  scanProgress?: number; // 0 to 100
  isScanning?: boolean;
  activeScrollIndex?: number; // Optional, controlled externally by scroll container
}

const TELEMETRY_LINES = [
  "Initializing local security handshake...",
  "Querying active socket telemetry interfaces...",
  "Evaluating network interface bindings (0.0.0.0 vs 127.0.0.1)...",
  "Probing local TCP listeners on top 1000 ports...",
  "Resolving process identifier (PID) association mapping...",
  "Retrieving executable system paths and file handles...",
  "Correlating process owner details and privilege levels...",
  "Analyzing banner grabs for service identification...",
  "Running rule-based local exposure assessment...",
  "Invoking Gemini LLM for semantic threat modeling...",
  "Compiling vulnerability posture report...",
  "Recalculating machine health index..."
];

export default function MachineNarrative({
  scanProgress = 0,
  isScanning = false,
  activeScrollIndex,
}: MachineNarrativeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Determine which line is currently active
  // If scanning, base it on progress percentage. Otherwise, base it on external scroll index or default to 0.
  let activeIndex = 0;
  if (isScanning) {
    activeIndex = Math.min(
      Math.floor((scanProgress / 100) * TELEMETRY_LINES.length),
      TELEMETRY_LINES.length - 1
    );
  } else if (activeScrollIndex !== undefined) {
    activeIndex = Math.max(0, Math.min(activeScrollIndex, TELEMETRY_LINES.length - 1));
  }

  // Auto-scroll the active line into view inside the container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const activeElement = container.querySelector(`[data-index="${activeIndex}"]`);
    if (activeElement) {
      activeElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeIndex]);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col justify-center h-full min-h-[50vh] px-6 select-none">
      {/* Narrative Section Header */}
      <div className="mb-6 text-left border-l border-white/10 pl-4">
        <p className="text-xs uppercase tracking-widest text-slate-500 font-mono">Section 03 // Telemetry Stream</p>
        <h3 className="text-2xl font-bold tracking-tight text-white mt-1 font-display">
          Machine Narrative
        </h3>
      </div>

      {/* Spotify Lyric Scroll Container */}
      <div
        ref={containerRef}
        className="h-80 overflow-y-hidden relative flex flex-col gap-6 py-20 mask-gradient"
        style={{
          maskImage: "linear-gradient(to bottom, transparent, white 20%, white 80%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, white 20%, white 80%, transparent)"
        }}
      >
        {TELEMETRY_LINES.map((line, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div
              key={idx}
              data-index={idx}
              className={`flex items-center gap-4 transition-all duration-500 ease-out py-1 ${
                isActive 
                  ? "opacity-100 scale-102 translate-x-2 text-white" 
                  : "opacity-15 scale-98 translate-x-0 text-slate-400"
              }`}
            >
              {/* Dynamic status indicator icon for active line */}
              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center font-mono text-[10px]">
                {isActive ? (
                  isScanning ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  ) : (
                    <span className="text-white font-bold">⚡</span>
                  )
                ) : (
                  <span className="text-slate-600">•</span>
                )}
              </div>

              {/* Telemetry line content */}
              <p
                className={`text-lg md:text-xl font-medium tracking-tight leading-relaxed transition-all duration-500 ${
                  isActive 
                    ? "font-display font-semibold drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" 
                    : "font-mono font-light"
                }`}
              >
                {line}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
