/* eslint-disable react-hooks/set-state-in-effect */
import { useRef, useEffect, useState, useCallback } from "react";

interface MachineNarrativeProps {
  scanProgress?: number; // 0 to 100
  isScanning?: boolean;
  activeScrollIndex?: number;
  scanPhase?: "discovery" | "assessment" | "correlation" | "";
}

interface TelemetryItem {
  text: string;
  tag: string;
  time: string;
}

const TELEMETRY_ITEMS: TelemetryItem[] = [
  { text: "Initializing local security handshake...", tag: "SEC_HANDSHAKE", time: "00:42:19.004" },
  { text: "Querying active socket telemetry interfaces...", tag: "SOCKET_QUERY", time: "00:42:24.112" },
  { text: "Evaluating network interface bindings (0.0.0.0 vs 127.0.0.1)...", tag: "NET_INTERFACE_EVAL", time: "00:42:27.889" },
  { text: "Probing local TCP listeners on top 1000 ports...", tag: "TCP_PROBE", time: "00:42:31.405" },
  { text: "Resolving process identifier (PID) association mapping...", tag: "PID_MAPPING", time: "00:42:36.771" },
  { text: "Retrieving executable system paths and file handles...", tag: "EXECUTABLE_PATHS", time: "00:42:42.902" },
  { text: "Correlating process owner details and privilege levels...", tag: "PRIVILEGE_CORRELATION", time: "00:42:47.108" },
  { text: "Analyzing banner grabs for service identification...", tag: "BANNER_GRAB", time: "00:42:51.332" },
  { text: "Running rule-based local exposure assessment...", tag: "EXPOSURE_ASSESSMENT", time: "00:42:55.912" },
  { text: "Invoking Gemini LLM for semantic threat modeling...", tag: "GEMINI_COGNITION", time: "00:43:01.004" },
  { text: "Compiling vulnerability posture report...", tag: "REPORT_COMPILE", time: "00:43:05.889" },
  { text: "Recalculating machine health index...", tag: "POSTURE_RECALC", time: "00:43:10.221" },
];

export default function MachineNarrative({
  scanProgress = 0,
  isScanning = false,
  activeScrollIndex,
  scanPhase: _scanPhase = "",
}: MachineNarrativeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [localActiveIndex, setLocalActiveIndex] = useState(0);
  
  // Indicator offset state
  const [indicatorTop, setIndicatorTop] = useState(0);
  const [indicatorHeight, setIndicatorHeight] = useState(96);

  // Track active index based on scroll position or scanning progress
  const activeIndex = isScanning
    ? Math.min(Math.floor((scanProgress / 100) * TELEMETRY_ITEMS.length), TELEMETRY_ITEMS.length - 1)
    : localActiveIndex;

  // Sync indicator position to active item
  const updateIndicator = useCallback(() => {
    const container = containerRef.current;
    const activeEl = itemRefs.current[activeIndex];
    if (container && activeEl) {
      // Relative offset of the active element inside the container's visible window
      const relativeTop = activeEl.offsetTop - container.scrollTop;
      setIndicatorTop(relativeTop);
      setIndicatorHeight(activeEl.clientHeight);
    }
  }, [activeIndex]);

  // Sync scrolling container to activeIndex when scanning automatically updates the progress
  useEffect(() => {
    if (!isScanning) return;
    const container = containerRef.current;
    if (!container) return;

    const activeEl = itemRefs.current[activeIndex];
    if (!activeEl) return;

    const targetScroll =
      activeEl.offsetTop -
      container.clientHeight / 2 +
      activeEl.clientHeight / 2;

    container.scrollTo({ top: targetScroll, behavior: "smooth" });
  }, [activeIndex, isScanning]);

  // Handle user manual scroll inside the container
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isScanning) return;

    const container = e.currentTarget;
    const children = container.querySelectorAll("[data-index]");
    const centerY = container.scrollTop + container.clientHeight / 2;

    let closestIdx = 0;
    let closestDist = Infinity;

    children.forEach((child) => {
      const el = child as HTMLElement;
      const idx = parseInt(el.dataset.index || "0", 10);
      const childCenter = el.offsetTop + el.clientHeight / 2;
      const dist = Math.abs(childCenter - centerY);

      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = idx;
      }
    });

    if (closestIdx !== localActiveIndex) {
      setLocalActiveIndex(closestIdx);
    }
    updateIndicator();
  };

  // Capture wheel events on lyrics scroll container to prevent page snapping until boundaries are reached
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (isScanning) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const isScrollable = scrollHeight > clientHeight;

      if (!isScrollable) return;

      const atBottom = scrollTop + clientHeight >= scrollHeight - 5 && e.deltaY > 0;
      const atTop = scrollTop <= 5 && e.deltaY < 0;

      if (!atBottom && !atTop) {
        e.stopPropagation();
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [isScanning]);

  // Sync indicator on index updates or resize
  useEffect(() => {
    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeIndex, updateIndicator]);

  // Allow compatibility with activeScrollIndex if passed
  useEffect(() => {
    if (activeScrollIndex !== undefined && !isScanning) {
      const idx = Math.min(Math.max(0, Math.round(activeScrollIndex)), TELEMETRY_ITEMS.length - 1);
      setLocalActiveIndex(idx);
    }
  }, [activeScrollIndex, isScanning]);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col justify-center h-[85vh] px-8 select-none">
      {/* Section Header */}
      <div className="mb-8 text-left border-l-2 border-white/10 pl-6">
        <p className="label-eyebrow text-slate-500">Section 03 // Telemetry Stream</p>
        <h3 className="text-3xl tracking-tight text-white mt-2 font-display font-bold uppercase">
          Machine Narrative
        </h3>
      </div>

      {/* Narrative Container / Editorial Layout */}
      <div className="relative w-full h-[65vh] flex pl-8 md:pl-16">
        {/* Vertical Timeline */}
        <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/10">
          <div
            style={{
              transform: `translateY(${indicatorTop}px)`,
              height: `${indicatorHeight}px`,
            }}
            className="absolute left-0 w-[2px] bg-amber-500 transition-all duration-500 ease-out -ml-[0.5px] shadow-[0_0_12px_rgba(245,158,11,0.5)]"
          />
        </div>

        {/* Scrollable Items */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="w-full h-full overflow-y-auto relative flex flex-col gap-12 py-[28vh] scrollbar-none snap-y snap-mandatory"
          style={{
            maskImage: "linear-gradient(to bottom, transparent, white 20%, white 80%, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, white 20%, white 80%, transparent)",
          }}
        >
          {TELEMETRY_ITEMS.map((item, idx) => {
            const dist = Math.abs(idx - activeIndex);
            const isActive = dist === 0;
            const isAdjacent = dist === 1;

            const opacity = isActive ? 1.0 : isAdjacent ? 0.6 : 0.3;
            const scale = isActive ? 1.02 : 0.95;
            const textShadow = isActive ? "0 0 20px rgba(255,165,0,0.25)" : "none";
            const fontWeight = isActive ? "600" : isAdjacent ? "400" : "300";

            return (
              <div
                key={idx}
                ref={(el) => {
                  itemRefs.current[idx] = el;
                }}
                data-index={idx}
                className="w-full text-left origin-left snap-center transition-all duration-500 ease"
                style={{
                  opacity,
                  transform: `scale(${scale}) ${isActive ? "translateX(16px)" : "translateX(0px)"}`,
                }}
              >
                {/* Telemetry metadata stamp */}
                <div
                  className={`font-mono text-[9px] md:text-xs mb-3 tracking-widest transition-colors duration-500 ${
                    isActive ? "text-amber-500 font-medium" : "text-slate-500"
                  }`}
                >
                  [{item.time}] {item.tag}
                </div>

                {/* Telemetry narrative line */}
                <p
                  style={{
                    textShadow,
                    fontWeight,
                    transition: "text-shadow 500ms ease, font-weight 500ms ease",
                  }}
                  className={`leading-tight tracking-tight uppercase font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl ${
                    isActive ? "text-white" : "text-slate-400"
                  }`}
                >
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
