import { useEffect, useState } from "react";
import { fetchHealth, setApiBase } from "../api/client";
import { ApiError, isAbortError } from "../api/errors";
import type { HealthResponse } from "../api/types";
import type { ApiLink } from "./useConnection";

const PENDING_POLL_MS = 3000;
const READY_POLL_MS = 20000;
const HEALTH_TIMEOUT_MS = 8000;

export type HealthState =
  | { phase: "checking"; message?: string }
  | { phase: "down"; title: string; message: string }
  | { phase: "invalid"; message: string }
  | { phase: "live"; health: HealthResponse };

export function useHealth(link: ApiLink): HealthState {
  const [state, setState] = useState<HealthState>({
    phase: "checking",
    message: "Looking for the laptop API.",
  });
  const base = link.phase === "online" ? link.base : "";
  const offlineMessage = link.phase === "offline" ? link.message : "";

  useEffect(() => {
    if (link.phase === "searching") {
      setState({ phase: "checking", message: "Looking for the laptop API." });
      return;
    }
    if (link.phase === "offline") {
      setState({
        phase: "down",
        title: "Laptop API offline",
        message: offlineMessage,
      });
      return;
    }

    setApiBase(base);
    let cancelled = false;
    let timer = 0;
    let active: AbortController | null = null;

    function schedule(delay: number) {
      timer = window.setTimeout(() => {
        void tick();
      }, delay);
    }

    async function tick() {
      const controller = new AbortController();
      active = controller;
      let timedOut = false;
      const timeout = window.setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, HEALTH_TIMEOUT_MS);

      try {
        const health = await fetchHealth(controller.signal);
        if (cancelled) return;
        setState({ phase: "live", health });
        schedule(health.status === "ready" ? READY_POLL_MS : PENDING_POLL_MS);
      } catch (error) {
        if (cancelled) return;
        if (isAbortError(error)) {
          setState({
            phase: "down",
            title: timedOut ? "Health check timed out" : "Health check interrupted",
            message: timedOut
              ? "The health check timed out before the API answered."
              : "The health check was interrupted.",
          });
        } else if (error instanceof ApiError && error.kind === "invalid") {
          setState({ phase: "invalid", message: error.message });
        } else if (error instanceof ApiError && error.kind === "http") {
          setState({ phase: "down", title: "API error", message: error.message });
        } else if (error instanceof Error) {
          setState({ phase: "down", title: "API not responding", message: error.message });
        } else {
          setState({
            phase: "down",
            title: "API not responding",
            message: "Could not reach the translator API.",
          });
        }
        schedule(PENDING_POLL_MS);
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void tick();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      active?.abort();
    };
  }, [link.phase, base, offlineMessage]);

  return state;
}
