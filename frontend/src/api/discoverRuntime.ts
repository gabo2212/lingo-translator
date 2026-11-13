import {
  chooseApiBase,
  connectBaseAllowed,
  connectFetchUrls,
  explicitBaseAllowed,
  LOOPBACK_BASE,
  LINGO_LOCAL_BASE,
  parseConnectApiBase,
  PROBE_TIMEOUT_MS,
  STORAGE_KEY,
  type DiscoveryChoice,
  type DiscoveryFacts,
  type HealthVerdict,
  type PageProtocol,
} from "./discover";

export type DiscoveryStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export type DiscoveryEnv = {
  pageProtocol: PageProtocol;
  pageHost: string;
  queryApi: string | null;
  githubRawUrl: string;
  fetchImpl?: typeof fetch;
  storage?: DiscoveryStorage;
  now?: () => number;
  timeoutMs?: number;
};

function blankFacts(pageProtocol: PageProtocol, queryApi: string | null): DiscoveryFacts {
  return {
    pageProtocol,
    queryApi,
    queryHealth: "miss",
    sameOriginHealth: "miss",
    loopbackHealth: "miss",
    lingoLocalHealth: "miss",
    connectProbes: [],
    storedBase: null,
    storedHealth: "miss",
  };
}

async function probeHealth(
  fetchImpl: typeof fetch,
  url: string,
  timeoutMs: number,
): Promise<HealthVerdict> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) return "miss";
    const data: unknown = await response.json();
    if (typeof data !== "object" || data === null || Array.isArray(data)) return "miss";
    const status = (data as { status?: unknown }).status;
    if (status === "ready" || status === "loading") return status;
    return "miss";
  } catch {
    return "miss";
  } finally {
    clearTimeout(timer);
  }
}

async function readConnectFile(
  fetchImpl: typeof fetch,
  url: string,
  timeoutMs: number,
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) return null;
    return parseConnectApiBase(await response.json());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function remember(storage: DiscoveryStorage, choice: DiscoveryChoice): void {
  if (!choice.base) return;
  storage.setItem(STORAGE_KEY, choice.base);
}

export async function discoverApi(env: DiscoveryEnv): Promise<DiscoveryChoice | null> {
  const timeoutMs = env.timeoutMs ?? PROBE_TIMEOUT_MS;
  const fetchImpl = env.fetchImpl ?? fetch;
  const storage = env.storage ?? window.localStorage;
  const now = env.now ?? Date.now;
  let facts = blankFacts(env.pageProtocol, env.queryApi);

  const query = explicitBaseAllowed(env.queryApi, env.pageProtocol);
  if (query) {
    const queryHealth = await probeHealth(fetchImpl, `${query}/api/health`, timeoutMs);
    facts = { ...facts, queryHealth };
    const chosen = chooseApiBase(facts, env.pageHost);
    if (chosen?.source === "query") {
      remember(storage, chosen);
      return chosen;
    }
  }

  const sameOriginHealth = await probeHealth(fetchImpl, "/api/health", timeoutMs);
  facts = { ...facts, sameOriginHealth };
  const sameOrigin = chooseApiBase(facts, env.pageHost);
  if (sameOrigin?.source === "same-origin") return sameOrigin;

  if (env.pageProtocol === "http:") {
    const loopbackHealth = await probeHealth(fetchImpl, `${LOOPBACK_BASE}/api/health`, timeoutMs);
    facts = { ...facts, loopbackHealth };
    const loopback = chooseApiBase(facts, env.pageHost);
    if (loopback?.source === "loopback") {
      remember(storage, loopback);
      return loopback;
    }
    const lingoLocalHealth = await probeHealth(fetchImpl, `${LINGO_LOCAL_BASE}/api/health`, timeoutMs);
    facts = { ...facts, lingoLocalHealth };
    const lingo = chooseApiBase(facts, env.pageHost);
    if (lingo?.source === "lingo.local") {
      remember(storage, lingo);
      return lingo;
    }
  }

  const files = await Promise.all(
    connectFetchUrls(env.githubRawUrl, now()).map((url) => readConnectFile(fetchImpl, url, timeoutMs)),
  );
  let connectProbes = facts.connectProbes;
  for (const apiBase of files) {
    const allowed = apiBase ? connectBaseAllowed(apiBase) : null;
    const health = allowed ? await probeHealth(fetchImpl, `${allowed}/api/health`, timeoutMs) : "miss";
    connectProbes = [...connectProbes, { apiBase: apiBase ?? "", health }];
    facts = { ...facts, connectProbes };
    const chosen = chooseApiBase(facts, env.pageHost);
    if (chosen?.source === "connect") {
      remember(storage, chosen);
      return chosen;
    }
  }

  const storedRaw = storage.getItem(STORAGE_KEY);
  const stored = explicitBaseAllowed(storedRaw, env.pageProtocol);
  if (stored) {
    const storedHealth = await probeHealth(fetchImpl, `${stored}/api/health`, timeoutMs);
    facts = { ...facts, storedBase: storedRaw, storedHealth };
    const chosen = chooseApiBase(facts, env.pageHost);
    if (chosen?.source === "stored") {
      remember(storage, chosen);
      return chosen;
    }
  }

  return null;
}
