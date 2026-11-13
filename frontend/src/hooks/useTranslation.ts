import { useCallback, useEffect, useRef, useState } from "react";
import { translateText } from "../api/client";
import { isAbortError } from "../api/errors";
import type { TranslateRequest, TranslateResponse } from "../api/types";
import { CLIENT_TIMEOUT_MS } from "../lib/constants";

export type TranslationPhase =
  | { phase: "idle" }
  | { phase: "loading"; request: TranslateRequest }
  | { phase: "done"; request: TranslateRequest; result: TranslateResponse }
  | { phase: "error"; request: TranslateRequest; message: string };

const TIMEOUT_MESSAGE =
  "Timed out after 130 seconds. The server did not answer in time.";

export function useTranslation() {
  const [state, setState] = useState<TranslationPhase>({ phase: "idle" });
  const stateRef = useRef(state);
  const generation = useRef(0);
  const inflight = useRef<AbortController | null>(null);
  const mounted = useRef(true);

  stateRef.current = state;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      inflight.current?.abort();
    };
  }, []);

  const submit = useCallback(async (request: TranslateRequest) => {
    const id = generation.current + 1;
    generation.current = id;
    const loading: TranslationPhase = { phase: "loading", request };
    stateRef.current = loading;
    setState(loading);

    const controller = new AbortController();
    const previous = inflight.current;
    inflight.current = controller;
    previous?.abort();
    let timedOut = false;
    const timer = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, CLIENT_TIMEOUT_MS);

    try {
      const result = await translateText(request, controller.signal);
      if (!mounted.current || generation.current !== id) return;
      const done: TranslationPhase = { phase: "done", request, result };
      stateRef.current = done;
      setState(done);
    } catch (error) {
      if (!mounted.current || generation.current !== id) return;
      if (isAbortError(error)) {
        const failed: TranslationPhase = {
          phase: "error",
          request,
          message: timedOut
            ? TIMEOUT_MESSAGE
            : "The translation request was cancelled.",
        };
        stateRef.current = failed;
        setState(failed);
        return;
      }
      const message = error instanceof Error ? error.message : "Translation failed.";
      const failed: TranslationPhase = { phase: "error", request, message };
      stateRef.current = failed;
      setState(failed);
    } finally {
      window.clearTimeout(timer);
      if (inflight.current === controller) inflight.current = null;
    }
  }, []);

  const regenerate = useCallback(() => {
    const current = stateRef.current;
    if (current.phase === "done" || current.phase === "error") {
      void submit(current.request);
    }
  }, [submit]);

  return { state, submit, regenerate };
}
