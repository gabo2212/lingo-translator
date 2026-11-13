import { describe, expect, it } from "vitest";
import {
  chooseApiBase,
  connectFetchUrls,
  parseConnectApiBase,
  type DiscoveryFacts,
  type HealthVerdict,
} from "../src/api/discover";

const PAGE = "class.example";

function facts(overrides: Partial<DiscoveryFacts> = {}): DiscoveryFacts {
  return {
    pageProtocol: "https:",
    queryApi: null,
    queryHealth: "miss",
    sameOriginHealth: "miss",
    loopbackHealth: "miss",
    lingoLocalHealth: "miss",
    connectProbes: [],
    storedBase: null,
    storedHealth: "miss",
    ...overrides,
  };
}

function ready(base: string, health: HealthVerdict = "ready") {
  return { apiBase: base, health };
}

describe("chooseApiBase", () => {
  it("uses same-origin when that health check is ready, ahead of connect.json", () => {
    const choice = chooseApiBase(
      facts({
        sameOriginHealth: "ready",
        loopbackHealth: "ready",
        connectProbes: [ready("https://laptop.trycloudflare.com")],
        storedBase: "https://stored.trycloudflare.com",
        storedHealth: "ready",
      }),
      PAGE,
    );
    expect(choice).toEqual({ base: "", hostLabel: PAGE, source: "same-origin" });
  });

  it("uses an https connect.json apiBase on an https page when earlier checks miss", () => {
    const choice = chooseApiBase(
      facts({
        connectProbes: [ready("https://laptop.trycloudflare.com/")],
      }),
      PAGE,
    );
    expect(choice).toEqual({
      base: "https://laptop.trycloudflare.com",
      hostLabel: "laptop.trycloudflare.com",
      source: "connect",
    });
  });

  it("rejects an http tunnel URL from connect.json on an https page", () => {
    const choice = chooseApiBase(
      facts({
        connectProbes: [ready("http://laptop.trycloudflare.com")],
        loopbackHealth: "ready",
        lingoLocalHealth: "ready",
      }),
      PAGE,
    );
    expect(choice).toBeNull();
  });

  it("skips an empty apiBase and uses the next https base", () => {
    const choice = chooseApiBase(
      facts({
        connectProbes: [ready(""), ready("https://next.trycloudflare.com", "loading")],
      }),
      PAGE,
    );
    expect(choice?.base).toBe("https://next.trycloudflare.com");
    expect(choice?.source).toBe("connect");
  });

  it("treats a missing apiBase string as empty", () => {
    expect(parseConnectApiBase({ apiBase: "", updatedAt: null })).toBeNull();
    expect(parseConnectApiBase({ apiBase: "   ", updatedAt: "2026-11-13T00:00:00Z" })).toBeNull();
    expect(parseConnectApiBase({ updatedAt: null })).toBeNull();
  });

  it("lets a healthy https query win over same-origin", () => {
    const choice = chooseApiBase(
      facts({
        queryApi: "https://forced.trycloudflare.com",
        queryHealth: "ready",
        sameOriginHealth: "ready",
      }),
      PAGE,
    );
    expect(choice?.source).toBe("query");
    expect(choice?.hostLabel).toBe("forced.trycloudflare.com");
  });

  it("rejects an http query on an https page", () => {
    const choice = chooseApiBase(
      facts({
        queryApi: "http://127.0.0.1:8000",
        queryHealth: "ready",
        sameOriginHealth: "loading",
      }),
      PAGE,
    );
    expect(choice?.source).toBe("same-origin");
  });

  it("uses loopback before lingo.local on an http page", () => {
    const choice = chooseApiBase(
      facts({
        pageProtocol: "http:",
        loopbackHealth: "ready",
        lingoLocalHealth: "ready",
        connectProbes: [ready("https://laptop.trycloudflare.com")],
      }),
      "127.0.0.1:5173",
    );
    expect(choice).toEqual({
      base: "http://127.0.0.1:8000",
      hostLabel: "127.0.0.1:8000",
      source: "loopback",
    });
  });

  it("uses lingo.local on an http page when loopback misses", () => {
    const choice = chooseApiBase(
      facts({
        pageProtocol: "http:",
        lingoLocalHealth: "loading",
      }),
      "teacher.local",
    );
    expect(choice?.source).toBe("lingo.local");
    expect(choice?.base).toBe("http://lingo.local:8000");
  });

  it("does not use loopback or lingo.local from an https page", () => {
    const choice = chooseApiBase(
      facts({
        loopbackHealth: "ready",
        lingoLocalHealth: "ready",
      }),
      PAGE,
    );
    expect(choice).toBeNull();
  });

  it("uses the stored https base only after the earlier sources miss", () => {
    const choice = chooseApiBase(
      facts({
        storedBase: "https://remembered.trycloudflare.com",
        storedHealth: "ready",
      }),
      PAGE,
    );
    expect(choice?.source).toBe("stored");
    expect(choice?.hostLabel).toBe("remembered.trycloudflare.com");
  });

  it("rejects a stored http base on an https page", () => {
    const choice = chooseApiBase(
      facts({
        storedBase: "http://127.0.0.1:8000",
        storedHealth: "ready",
      }),
      PAGE,
    );
    expect(choice).toBeNull();
  });

  it("ignores a connect.json base whose health is not ready or loading", () => {
    const choice = chooseApiBase(
      facts({
        connectProbes: [ready("https://laptop.trycloudflare.com", "miss")],
      }),
      PAGE,
    );
    expect(choice).toBeNull();
  });

  it("cache-busts the GitHub raw file and always requests /connect.json", () => {
    expect(connectFetchUrls("", 10)).toEqual(["/connect.json?t=10"]);
    expect(
      connectFetchUrls("https://raw.githubusercontent.com/owner/repo/main/connect.json", 10),
    ).toEqual([
      "https://raw.githubusercontent.com/owner/repo/main/connect.json?t=10",
      "/connect.json?t=10",
    ]);
  });
});
