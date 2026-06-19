import type { Connection } from "../../types/finding";

interface TopologyMapProps {
  connections?: Connection[];
  onNodeClick?: (nodeId: string, processName: string) => void;
  activeNodeId?: string | null;
}

export default function TopologyMap({
  connections = [],
  onNodeClick,
  activeNodeId = null,
}: TopologyMapProps) {
  // If no connections, provide default mock nodes for the live demonstration look
  const activeConnections = connections.length > 0 ? connections : [
    { processName: "mysqld.exe", processPid: 4821, port: 3306, protocol: "tcp", state: "listening", severity: "critical" },
    { processName: "sshd.exe", processPid: 1240, port: 22, protocol: "tcp", state: "listening", severity: "high" },
    { processName: "nginx.exe", processPid: 2201, port: 80, protocol: "tcp", state: "listening", severity: "medium" },
    { processName: "redis-server.exe", processPid: 3102, port: 6379, protocol: "tcp", state: "listening", severity: "medium" },
    { processName: "explorer.exe", processPid: 1040, port: 139, protocol: "tcp", state: "listening", severity: "low" },
  ] as Connection[];

  const width = 600;
  const height = 400;
  const cx = width / 2;
  const cy = height / 2;

  // Calculate coordinates for nodes positioned in a circle
  const radius = 130;
  const nodeCount = activeConnections.length;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "#EF4444";
      case "high": return "#F97316";
      case "medium": return "#EAB308";
      default: return "#22C55E";
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col justify-center select-none bg-slate-950/20 rounded-2xl border border-white/[0.03] p-6 relative overflow-hidden backdrop-blur-md">
      
      {/* Topology Header Info */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-left">
          <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Section 05 // Spatial telemetry</p>
          <h3 className="text-xl font-bold tracking-tight text-white mt-1 font-display">
            Connection Landscape
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.02] border border-white/5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">LIVE FEED</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-[350px] overflow-visible"
      >
        <defs>
          {/* Subtle drop shadows for nodes */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Central Node: Local Host */}
        <circle
          cx={cx}
          cy={cy}
          r="24"
          fill="#070a13"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="1.5"
          className="animate-pulse"
        />
        <circle
          cx={cx}
          cy={cy}
          r="6"
          fill="#ffffff"
        />
        <text
          x={cx}
          y={cy + 38}
          textAnchor="middle"
          fill="#94a3b8"
          className="text-[10px] font-mono tracking-widest font-semibold"
        >
          HOST [127.0.0.1]
        </text>

        {/* Process Nodes and Edges */}
        {activeConnections.map((conn, idx) => {
          const angle = (idx * 2 * Math.PI) / nodeCount - Math.PI / 2;
          const nx = cx + radius * Math.cos(angle);
          const ny = cy + radius * Math.sin(angle);
          
          const color = getSeverityColor(conn.severity);
          const isSelected = activeNodeId === `${conn.processName}-${conn.port}`;

          return (
            <g key={`${conn.processName}-${conn.port}`} className="group cursor-pointer">
              
              {/* Edge line linking host to process */}
              <line
                x1={cx}
                y1={cy}
                x2={nx}
                y2={ny}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="1.5"
              />
              
              {/* Pulsing overlay flow line */}
              <line
                x1={cx}
                y1={cy}
                x2={nx}
                y2={ny}
                stroke={color}
                strokeWidth="1.2"
                strokeOpacity="0.4"
                strokeDasharray="6, 12"
                style={{
                  animation: "dash 4s linear infinite",
                  animationDirection: idx % 2 === 0 ? "normal" : "reverse"
                }}
              />

              {/* Process Outer Glow Ring */}
              <circle
                cx={nx}
                cy={ny}
                r={isSelected ? "18" : "12"}
                fill="transparent"
                stroke={color}
                strokeWidth="1.5"
                strokeOpacity="0.3"
                className="group-hover:scale-125 transition-all duration-300 animate-pulse"
              />

              {/* Process Node Circle */}
              <circle
                cx={nx}
                cy={ny}
                r={isSelected ? "10" : "8"}
                fill="#070a13"
                stroke={color}
                strokeWidth="2.5"
                onClick={() => onNodeClick && onNodeClick(`${conn.processName}-${conn.port}`, conn.processName)}
                className="transition-all duration-300"
              />

              {/* Process Text Label (Asymmetrical rotation offset to prevent overlapping) */}
              <text
                x={nx + (Math.cos(angle) * 16)}
                y={ny + (Math.sin(angle) * 8) + 4}
                textAnchor={Math.cos(angle) >= 0 ? "start" : "end"}
                fill={isSelected ? "#ffffff" : "#94a3b8"}
                className={`text-[9px] font-mono transition-all duration-300 ${
                  isSelected ? "font-bold" : "group-hover:fill-white"
                }`}
                onClick={() => onNodeClick && onNodeClick(`${conn.processName}-${conn.port}`, conn.processName)}
              >
                {conn.processName} <tspan fill={color} className="font-bold">:{conn.port}</tspan>
              </text>

            </g>
          );
        })}
      </svg>

      {/* Inline CSS Keyframe for stroke animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes dash {
          to {
            stroke-dashoffset: -120;
          }
        }
      `}} />

      {/* Tiny Legend */}
      <div className="flex justify-center gap-4 border-t border-white/[0.04] pt-4 mt-2 text-[9px] font-mono text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>Critical</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          <span>High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Secure</span>
        </div>
      </div>

    </div>
  );
}
