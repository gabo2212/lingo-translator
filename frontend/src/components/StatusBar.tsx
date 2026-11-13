import type { HealthResponse } from "../api/types";
import type { HealthState } from "../hooks/useHealth";

type StatusTone = "wait" | "ready" | "bad";

type StatusLine = {
  id: string;
  text: string;
  mono?: boolean;
};

type StatusView = {
  tone: StatusTone;
  title: string;
  lines: StatusLine[];
};

function hardwareLine(health: HealthResponse): string {
  return [health.device, health.gpu_name, health.dtype]
    .map((part) => part?.trim() ?? "")
    .filter((part) => part.length > 0)
    .join(" · ");
}

function describeHealth(state: HealthState): StatusView {
  if (state.phase === "checking") {
    return {
      tone: "wait",
      title: "Checking the API",
      lines: [{ id: "unknown", text: "Model status is not known yet." }],
    };
  }

  if (state.phase === "down") {
    return {
      tone: "bad",
      title: state.title,
      lines: [
        { id: "message", text: state.message },
        { id: "unloaded", text: "The model is not reported as loaded." },
      ],
    };
  }

  if (state.phase === "invalid") {
    return {
      tone: "bad",
      title: "Health check unreadable",
      lines: [
        { id: "message", text: state.message },
        { id: "unloaded", text: "The model is not reported as loaded." },
      ],
    };
  }

  const health = state.health;
  const lines: StatusLine[] = [];
  if (health.model.trim()) {
    lines.push({ id: "model", text: health.model.trim(), mono: true });
  }
  const hardware = hardwareLine(health);
  if (hardware) lines.push({ id: "hardware", text: hardware, mono: true });

  if (health.status === "ready") {
    return { tone: "ready", title: "Model ready", lines };
  }

  if (health.status === "loading") {
    lines.push({ id: "not-ready", text: "Not ready yet." });
    if (health.detail?.trim()) lines.push({ id: "detail", text: health.detail.trim() });
    return { tone: "wait", title: "Model loading", lines };
  }

  lines.push({
    id: "detail",
    text: health.detail?.trim() || "The server reported an error and the model is not ready.",
  });
  return { tone: "bad", title: "Model error", lines };
}

type StatusBarProps = {
  state: HealthState;
  hostLabel?: string | null;
};

export function StatusBar({ state, hostLabel }: StatusBarProps) {
  const view = describeHealth(state);
  const detail = view.tone === "bad" ? view.lines.map((line) => line.text).join(" ") : null;
  const searching = state.phase === "checking" ? state.message ?? null : null;
  return (
    <p className={`status status-${view.tone}`} aria-live="polite">
      <span className="status-dot" aria-hidden="true" />
      <span className="status-title">{view.title}</span>
      {hostLabel ? <span className="status-line mono">{hostLabel}</span> : null}
      {searching ? <span className="status-line">{searching}</span> : null}
      {detail ? <span className="status-line">{detail}</span> : null}
    </p>
  );
}
