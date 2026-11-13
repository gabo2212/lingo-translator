export const PROBE_TIMEOUT_MS = 1500;
export const STORAGE_KEY = "lingo.apiBase";
export const LOOPBACK_BASE = "http://127.0.0.1:8000";
export const LINGO_LOCAL_BASE = "http://lingo.local:8000";

export const LAPTOP_OFFLINE_MESSAGE =
  "The laptop running the model is offline or not reachable. The slides still work. This page will not invent a translation.";

export type PageProtocol = "http:" | "https:";
export type HealthVerdict = "ready" | "loading" | "miss";

export type ConnectProbe = {
  apiBase: string;
  health: HealthVerdict;
};

export type DiscoveryFacts = {
  pageProtocol: PageProtocol;
  queryApi: string | null;
  queryHealth: HealthVerdict;
  sameOriginHealth: HealthVerdict;
  loopbackHealth: HealthVerdict;
  lingoLocalHealth: HealthVerdict;
  connectProbes: readonly ConnectProbe[];
  storedBase: string | null;
  storedHealth: HealthVerdict;
};

export type DiscoverySource =
  | "query"
  | "same-origin"
  | "loopback"
  | "lingo.local"
  | "connect"
  | "stored";

export type DiscoveryChoice = {
  base: string;
  hostLabel: string;
  source: DiscoverySource;
};

export function usableHealth(verdict: HealthVerdict): boolean {
  return verdict === "ready" || verdict === "loading";
}

export function explicitBaseAllowed(raw: string | null, pageProtocol: PageProtocol): string | null {
  if (raw === null) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (pageProtocol === "https:" && url.protocol !== "https:") return null;
  const path = url.pathname.replace(/\/+$/, "");
  const suffix = path.length > 0 ? path : "";
  return `${url.protocol}//${url.host}${suffix}`;
}

/** connect.json may only name an https API, on any page. */
export function connectBaseAllowed(raw: string | null): string | null {
  return explicitBaseAllowed(raw, "https:");
}

export function hostLabelFor(base: string, pageHost: string): string {
  if (!base) return pageHost || "this page";
  try {
    return new URL(base).host;
  } catch {
    return pageHost || base;
  }
}

function choice(base: string, pageHost: string, source: DiscoverySource): DiscoveryChoice {
  return { base, hostLabel: hostLabelFor(base, pageHost), source };
}

export function chooseApiBase(facts: DiscoveryFacts, pageHost: string): DiscoveryChoice | null {
  const query = explicitBaseAllowed(facts.queryApi, facts.pageProtocol);
  if (query && usableHealth(facts.queryHealth)) {
    return choice(query, pageHost, "query");
  }

  if (usableHealth(facts.sameOriginHealth)) {
    return choice("", pageHost, "same-origin");
  }

  if (facts.pageProtocol === "http:") {
    if (usableHealth(facts.loopbackHealth)) {
      return choice(LOOPBACK_BASE, pageHost, "loopback");
    }
    if (usableHealth(facts.lingoLocalHealth)) {
      return choice(LINGO_LOCAL_BASE, pageHost, "lingo.local");
    }
  }

  for (const probe of facts.connectProbes) {
    const base = connectBaseAllowed(probe.apiBase);
    if (!base || !usableHealth(probe.health)) continue;
    return choice(base, pageHost, "connect");
  }

  const stored = explicitBaseAllowed(facts.storedBase, facts.pageProtocol);
  if (stored && usableHealth(facts.storedHealth)) {
    return choice(stored, pageHost, "stored");
  }

  return null;
}

export function connectFetchUrls(githubRaw: string, now: number): string[] {
  const urls: string[] = [];
  const trimmed = githubRaw.trim();
  if (trimmed) {
    const join = trimmed.includes("?") ? "&" : "?";
    urls.push(`${trimmed}${join}t=${now}`);
  }
  urls.push(`/connect.json?t=${now}`);
  return urls;
}

export function parseConnectApiBase(data: unknown): string | null {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return null;
  const apiBase = (data as { apiBase?: unknown }).apiBase;
  if (typeof apiBase !== "string") return null;
  const trimmed = apiBase.trim();
  return trimmed.length > 0 ? trimmed : null;
}
