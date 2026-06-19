import { useState, useEffect } from "react";
import type { Connection } from "../types/finding";

export function useLiveStream() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  useEffect(() => {
    // API is served locally relative to current hostname or falls back to localhost:8000
    const baseURL = import.meta.env.DEV ? "http://localhost:8000" : "";
    const eventSource = new EventSource(`${baseURL}/api/live/connections`);

    eventSource.addEventListener("connection_update", (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload && Array.isArray(payload.connections)) {
          setConnections(payload.connections);
        }
        setIsLiveConnected(true);
      } catch (err) {
        console.error("Error parsing live connections update payload", err);
      }
    });

    eventSource.addEventListener("error", (event) => {
      console.error("Live connections stream error", event);
      setIsLiveConnected(false);
    });

    eventSource.onopen = () => {
      setIsLiveConnected(true);
    };

    return () => {
      eventSource.close();
      setIsLiveConnected(false);
    };
  }, []);

  return { connections, isLiveConnected };
}
