import { useState, useRef } from "react";
import type { ScanReport, Finding } from "../types/finding";

interface HookScanState {
  status: "idle" | "running" | "complete" | "error";
  progress: number;
  phase: "discovery" | "assessment" | "correlation" | "";
  findings: Finding[];
  scanId: string | null;
  report: ScanReport | null;
  error: string | null;
}

export function useScan() {
  const [scanState, setScanState] = useState<HookScanState>({
    status: "idle",
    progress: 0,
    phase: "",
    findings: [],
    scanId: null,
    report: null,
    error: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  const startScan = async (target: string = "127.0.0.1") => {
    // Reset state and cancel any active event source
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setScanState({
      status: "running",
      progress: 0,
      phase: "discovery",
      findings: [],
      scanId: null,
      report: null,
      error: null,
    });

    const baseURL = import.meta.env.DEV ? "http://localhost:8000" : "";

    try {
      // 1. Trigger the background scan task
      const triggerResponse = await fetch(`${baseURL}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, intensity: "standard" }),
      });

      if (!triggerResponse.ok) {
        throw new Error(`Failed to initialize scan: ${triggerResponse.statusText}`);
      }

      const triggerData = await triggerResponse.json();
      const scanId = triggerData.scanId;

      setScanState((prev) => ({ ...prev, scanId }));

      // 2. Open EventSource status listener
      const eventSource = new EventSource(`${baseURL}/api/scan/status?scanId=${scanId}`);
      eventSourceRef.current = eventSource;

      eventSource.addEventListener("scan_progress", (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          setScanState((prev) => ({
            ...prev,
            status: "running",
            progress: data.progress,
            phase: data.phase,
            // Convert foundSoFar to temporary partial Finding objects if needed for intermediate UI
          }));
        } catch (err) {
          console.error("Error parsing scan progress payload", err);
        }
      });

      eventSource.addEventListener("scan_complete", (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.status === "complete" && data.report) {
            setScanState((prev) => ({
              ...prev,
              status: "complete",
              progress: 100,
              phase: "correlation",
              report: data.report,
              findings: data.report.findings,
            }));
          } else {
            setScanState((prev) => ({
              ...prev,
              status: "error",
              error: data.error || "Scan failed without error description",
            }));
          }
        } catch (err) {
          console.error("Error parsing scan complete payload", err);
        } finally {
          eventSource.close();
        }
      });

      eventSource.addEventListener("error", (event) => {
        console.error("Scan progress EventSource error", event);
        setScanState((prev) => ({
          ...prev,
          status: "error",
          error: "Lost connection to scan progress monitor",
        }));
        eventSource.close();
      });

    } catch (err: any) {
      console.error("Error triggering scan:", err);
      setScanState((prev) => ({
        ...prev,
        status: "error",
        error: err?.message || "Failed to trigger deep scan",
      }));
    }
  };

  const resetScan = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setScanState({
      status: "idle",
      progress: 0,
      phase: "",
      findings: [],
      scanId: null,
      report: null,
      error: null,
    });
  };

  return { scanState, startScan, resetScan };
}
