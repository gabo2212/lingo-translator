import { useEffect, useRef, useState } from "react";
import type { TranslateResponse } from "../api/types";
import type { TranslationPhase } from "../hooks/useTranslation";

function ResultMeta({ result }: { result: TranslateResponse }) {
  const seconds = (result.elapsed_ms / 1000).toFixed(1);
  const rows = [
    ["Model", result.model],
    ["Device", result.device],
    ["Time", `${seconds} s`],
    ["Prompt", result.prompt_id ?? ""],
  ].filter((row) => row[1].trim().length > 0);

  return (
    <dl className="meta">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

type ResultPanelProps = {
  state: TranslationPhase;
  onRegenerate: () => void;
};

export function ResultPanel({ state, onRegenerate }: ResultPanelProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const copyTimer = useRef(0);

  const translationText = state.phase === "done" ? state.result.translation : "";

  useEffect(() => {
    setCopied(false);
    setCopyError(null);
  }, [translationText]);

  useEffect(() => {
    return () => window.clearTimeout(copyTimer.current);
  }, []);

  async function copyTranslation() {
    if (!translationText) return;
    try {
      await navigator.clipboard.writeText(translationText);
      setCopyError(null);
      setCopied(true);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setCopyError("Clipboard permission was denied.");
    }
  }

  return (
    <section className="panel result-panel" aria-labelledby="result-heading" aria-busy={state.phase === "loading"}>
      <h2 id="result-heading">Rewrite</h2>
      <div className="result-body" aria-live="polite">
        {state.phase === "idle" ? <p className="result-empty">The rewrite shows up here.</p> : null}
        {state.phase === "loading" ? <p className="pending-copy">Translating…</p> : null}
        {state.phase === "error" ? <p className="error-message">{state.message}</p> : null}
        {state.phase === "done" ? (
          state.result.translation.trim().length === 0 ? (
            <p className="pending-copy">Empty.</p>
          ) : (
            <p className="translation-text">{state.result.translation}</p>
          )
        ) : null}
        {state.phase === "done" ? <ResultMeta result={state.result} /> : null}
      </div>

      {state.phase === "done" || state.phase === "error" ? (
        <div className="result-actions">
          <div className="button-row">
            {state.phase === "done" && translationText.length > 0 ? (
              <button type="button" onClick={() => void copyTranslation()}>
                {copied ? "Copied" : "Copy"}
              </button>
            ) : null}
            <button type="button" onClick={onRegenerate}>
              Regenerate
            </button>
          </div>
          {copyError ? (
            <p className="field-help" role="status">
              {copyError}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
