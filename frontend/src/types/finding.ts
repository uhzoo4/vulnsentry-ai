export type Severity = "critical" | "high" | "medium" | "low";
export type FindingStatus = "open" | "mitigated" | "dismissed" | "snoozed";
export type ScanPhase = "discovery" | "assessment" | "correlation";

export interface Remediation {
  command: string;
  description: string;
  os: "windows" | "linux" | "macos";
  requiresAdmin: boolean;
}

export interface Finding {
  id: string;
  severity: Severity;
  serviceName: string;
  port: number;
  protocol: "tcp" | "udp";
  processName: string;
  processPid: number;
  processPath?: string;
  riskScore: number; // 0-10
  ruleId: string; // links to risk_engine rule
  fixDifficulty: number; // 1-5
  status: FindingStatus;
  teachBlock?: string; // lazy load
  remediation?: Remediation;
  discoveredAt: string; // ISO timestamp
}

export interface Connection {
  processName: string;
  processPid: number;
  processPath?: string;
  port: number;
  protocol: "tcp" | "udp";
  state: "listening" | "established" | "time_wait";
  severity: Severity;
}

export interface ScanState {
  status: "idle" | "running" | "complete" | "error";
  progress: number; // 0-100
  phase: ScanPhase;
  findings: Finding[];
  startedAt?: string;
  completedAt?: string;
}

export interface ScanReport {
  scanId: string;
  target: string;
  timestamp: string;
  postureScore: number;
  previousPostureScore?: number;
  summary: {
    totalPortsScanned: number;
    openPortsFound: number;
    criticalFindings: number;
    highFindings: number;
    mediumFindings: number;
    lowFindings: number;
  };
  findings: Finding[];
  aiInsight?: {
    recommendation: string;
    topFindingId: string;
  };
  delta?: {
    resolvedFindingIds: string[];
    newFindingIds: string[];
    attackSurfaceChangePercent: number;
  };
}
