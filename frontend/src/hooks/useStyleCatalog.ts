import { useEffect, useState } from "react";
import { FALLBACK_STYLES } from "../api/catalog";
import { fetchStyles } from "../api/client";
import type { StyleOption } from "../api/types";
import type { ApiLink } from "./useConnection";

export type CatalogSource = "pending" | "api" | "fallback";

const STYLES_TIMEOUT_MS = 8000;

export function useStyleCatalog(link: ApiLink): { styles: readonly StyleOption[]; source: CatalogSource } {
  const [styles, setStyles] = useState<readonly StyleOption[]>(FALLBACK_STYLES);
  const [source, setSource] = useState<CatalogSource>("pending");
  const online = link.phase === "online";
  const base = link.phase === "online" ? link.base : "";

  useEffect(() => {
    if (link.phase === "offline") {
      setStyles(FALLBACK_STYLES);
      setSource("fallback");
      return;
    }
    if (!online) return;

    let cancelled = false;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), STYLES_TIMEOUT_MS);

    fetchStyles(controller.signal)
      .then((next) => {
        if (cancelled) return;
        setStyles(next);
        setSource("api");
      })
      .catch(() => {
        if (cancelled) return;
        setStyles(FALLBACK_STYLES);
        setSource("fallback");
      })
      .finally(() => {
        window.clearTimeout(timeout);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [link.phase, online, base]);

  return { styles, source };
}
