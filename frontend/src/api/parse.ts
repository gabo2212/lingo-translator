import type {
  HealthResponse,
  HealthStatus,
  StyleOption,
  Substyle,
  TranslateResponse,
} from "./types";

const HEALTH_STATUSES = new Set<HealthStatus>(["loading", "ready", "error"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function parseSubstyles(value: unknown): Substyle[] | null | undefined {
  if (value === null || value === undefined) return null;
  if (!Array.isArray(value)) return undefined;
  const substyles: Substyle[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== "string" || typeof item.label !== "string") {
      return undefined;
    }
    substyles.push({ id: item.id, label: item.label });
  }
  return substyles;
}

export function parseHealth(value: unknown): HealthResponse | null {
  if (!isRecord(value)) return null;
  if (typeof value.status !== "string" || !HEALTH_STATUSES.has(value.status as HealthStatus)) {
    return null;
  }
  if (typeof value.model !== "string" || typeof value.device !== "string") return null;
  const health: HealthResponse = {
    status: value.status as HealthStatus,
    model: value.model,
    device: value.device,
  };
  const gpuName = optionalString(value.gpu_name);
  const dtype = optionalString(value.dtype);
  const detail = optionalString(value.detail);
  if (gpuName !== undefined) health.gpu_name = gpuName;
  if (dtype !== undefined) health.dtype = dtype;
  if (detail !== undefined) health.detail = detail;
  return health;
}

export function parseStyles(value: unknown): StyleOption[] | null {
  if (!isRecord(value) || !Array.isArray(value.styles) || value.styles.length === 0) return null;
  const styles: StyleOption[] = [];
  for (const item of value.styles) {
    if (
      !isRecord(item) ||
      typeof item.id !== "string" ||
      typeof item.label !== "string" ||
      typeof item.description !== "string"
    ) {
      return null;
    }
    const substyles = parseSubstyles(item.substyles);
    if (substyles === undefined) return null;
    styles.push({
      id: item.id,
      label: item.label,
      description: item.description,
      substyles,
    });
  }
  return styles;
}

export function parseTranslation(value: unknown): TranslateResponse | null {
  if (!isRecord(value)) return null;
  if (typeof value.translation !== "string") return null;
  if (typeof value.style !== "string") return null;
  if (!(value.linkedin_tone === null || typeof value.linkedin_tone === "string")) return null;
  if (typeof value.model !== "string" || typeof value.device !== "string") return null;
  if (typeof value.elapsed_ms !== "number" || !Number.isFinite(value.elapsed_ms)) return null;
  const translation: TranslateResponse = {
    translation: value.translation,
    style: value.style,
    linkedin_tone: value.linkedin_tone,
    model: value.model,
    device: value.device,
    elapsed_ms: value.elapsed_ms,
  };
  if (typeof value.prompt_id === "string") translation.prompt_id = value.prompt_id;
  return translation;
}
