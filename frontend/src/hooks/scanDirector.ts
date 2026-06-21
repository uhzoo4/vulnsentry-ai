// ── Scan Director ──────────────────────────────────────────────────────────
// Pure function module. Converts raw scan status + phase into display state.
// No React, no hooks, no side effects. Called synchronously from App.tsx
// on every render to derive labels, telemetry text, and topology parameters.

export type ScanStatus = "idle" | "running" | "complete" | "error";
export type ScanPhase = "discovery" | "assessment" | "correlation" | "";

// ── Badge label (replaces LIVE badge on HeroThreatCard) ──
export function getScanLabel(status: ScanStatus, phase: ScanPhase): string {
  if (status === "idle" || status === "error") return "LIVE";
  if (status === "complete") return "ACTIVE";

  switch (phase) {
    case "discovery":   return "INITIALIZING";
    case "assessment":  return "ANALYZING";
    case "correlation": return "REPORTING";
    default:            return "SCANNING";
  }
}

// ── Telemetry sub-text (shown beneath the score gauge) ──
export function getScanTelemetry(status: ScanStatus, phase: ScanPhase): string {
  if (status === "idle")     return "";
  if (status === "complete") return "SCAN COMPLETE";
  if (status === "error")    return "SCAN FAILED";

  switch (phase) {
    case "discovery":   return "ASSESSING SYSTEM";
    case "assessment":  return "CORRELATING RISK";
    case "correlation": return "COMPILING REPORT";
    default:            return "PREPARING";
  }
}

// ── Topology scan intensity parameters ──
// These are multipliers applied to existing animation values inside
// SpatialTopology's useFrame loops. They shift orbit speed, connection
// opacity, and host glow intensity without redesigning the scene.
export interface TopologyIntensity {
  orbitSpeedMultiplier: number;    // ServiceNode orbit velocity
  connectionOpacityBoost: number; // Edge line opacity addend
  hostGlowMultiplier: number;     // HostNode breathing scale factor
}

export function getTopologyIntensity(status: ScanStatus, phase: ScanPhase): TopologyIntensity {
  if (status !== "running") {
    return { orbitSpeedMultiplier: 1.0, connectionOpacityBoost: 0, hostGlowMultiplier: 1.0 };
  }

  switch (phase) {
    case "discovery":
      return { orbitSpeedMultiplier: 1.6, connectionOpacityBoost: 0, hostGlowMultiplier: 1.0 };
    case "assessment":
      return { orbitSpeedMultiplier: 1.3, connectionOpacityBoost: 0.12, hostGlowMultiplier: 1.0 };
    case "correlation":
      return { orbitSpeedMultiplier: 1.0, connectionOpacityBoost: 0.08, hostGlowMultiplier: 1.8 };
    default:
      return { orbitSpeedMultiplier: 1.2, connectionOpacityBoost: 0, hostGlowMultiplier: 1.0 };
  }
}