import { ApiError, isAbortError } from "./errors";
import { parseHealth, parseStyles, parseTranslation } from "./parse";
import type { HealthResponse, StyleOption, TranslateRequest, TranslateResponse } from "./types";

function detailToMessage(detail: unknown): string | null {
  if (typeof detail === "string" && detail.trim()) return detail.trim();
  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (isRecord(item) && typeof item.msg === "string") return item.msg.trim();
        return "";
      })
      .filter((part) => part.length > 0);
    if (parts.length > 0) return parts.join(" ");
  }
  if (detail && typeof detail === "object") {
    try {
      return JSON.stringify(detail);
    } catch {
      return null;
    }
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

let apiBase = "";

export function getApiBase(): string {
  return apiBase;
}

export function setApiBase(next: string): void {
  apiBase = next.replace(/\/+$/, "");
}

function resolvePath(path: string): string {
  if (!apiBase) return path;
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${apiBase}${suffix}`;
}

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  const trimmed = text.trim();
  if (!trimmed) {
    if (response.status === 500 || response.status === 502 || response.status === 503) {
      return `The translator API did not answer (HTTP ${response.status}).`;
    }
    return `The server returned ${response.status} with no message.`;
  }
  if (trimmed.startsWith("<")) {
    return `The server returned ${response.status} with an HTML error page.`;
  }
  try {
    const data: unknown = JSON.parse(trimmed);
    if (isRecord(data) && "detail" in data) {
      const message = detailToMessage(data.detail);
      if (message) return message.slice(0, 800);
    }
    if (isRecord(data) && typeof data.message === "string" && data.message.trim()) {
      return data.message.trim().slice(0, 800);
    }
  } catch {
    return trimmed.slice(0, 800);
  }
  return trimmed.slice(0, 800);
}

async function request(
  path: string,
  signal: AbortSignal,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
): Promise<Response> {
  try {
    return await fetch(resolvePath(path), {
      method: init?.method,
      body: init?.body,
      signal,
      headers: {
        Accept: "application/json",
        ...init?.headers,
      },
    });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new ApiError("network", "Could not reach the translator API.");
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new ApiError("invalid", "The server response was not valid JSON.");
  }
}

export async function fetchHealth(signal: AbortSignal): Promise<HealthResponse> {
  const response = await request("/api/health", signal);
  if (!response.ok) {
    throw new ApiError("http", await readErrorMessage(response));
  }
  const health = parseHealth(await readJson(response));
  if (!health) {
    throw new ApiError(
      "invalid",
      "The health check did not include status, model, and device.",
    );
  }
  return health;
}

export async function fetchStyles(signal: AbortSignal): Promise<StyleOption[]> {
  const response = await request("/api/styles", signal);
  if (!response.ok) {
    throw new ApiError("http", await readErrorMessage(response));
  }
  const styles = parseStyles(await readJson(response));
  if (!styles) {
    throw new ApiError("invalid", "The style list did not match the expected catalog.");
  }
  return styles;
}

export async function translateText(
  body: TranslateRequest,
  signal: AbortSignal,
): Promise<TranslateResponse> {
  const payload: TranslateRequest = {
    text: body.text,
    style: body.style,
    linkedin_tone: body.linkedin_tone,
    temperature: body.temperature,
    max_new_tokens: body.max_new_tokens,
    seed: body.seed,
  };
  const response = await request("/api/translate", signal, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new ApiError("http", await readErrorMessage(response));
  }
  const translation = parseTranslation(await readJson(response));
  if (!translation) {
    throw new ApiError("invalid", "The server response did not include a translation.");
  }
  return translation;
}
