import type { StyleOption, TranslateRequest } from "../api/types";
import {
  TEMP_DEFAULT,
  TEMP_MAX,
  TEMP_MIN,
  TEMP_STEP,
  TOKENS_DEFAULT,
  TOKENS_MAX,
  TOKENS_MIN,
} from "./constants";

export function quantizeTemperature(value: number): number {
  if (!Number.isFinite(value)) return TEMP_DEFAULT;
  const clamped = Math.min(TEMP_MAX, Math.max(TEMP_MIN, value));
  const steps = Math.round((clamped - TEMP_MIN) / TEMP_STEP);
  return Number((TEMP_MIN + steps * TEMP_STEP).toFixed(2));
}

export function clampTokens(value: number): number {
  if (!Number.isFinite(value)) return TOKENS_DEFAULT;
  const rounded = Math.round(value);
  return Math.min(TOKENS_MAX, Math.max(TOKENS_MIN, rounded));
}

export function linkedinTone(
  styles: readonly StyleOption[],
  styleId: string,
  toneId: string,
): string | null {
  if (styleId !== "linkedin") return null;
  const style = styles.find((item) => item.id === styleId);
  const substyles = style?.substyles;
  if (!substyles || substyles.length === 0) return null;
  const match = substyles.find((item) => item.id === toneId);
  return match ? match.id : substyles[0].id;
}

export function createTranslateRequest(
  text: string,
  styles: readonly StyleOption[],
  styleId: string,
  toneId: string,
  temperature: number,
  maxNewTokens: number,
): TranslateRequest {
  return {
    text,
    style: styleId,
    linkedin_tone: linkedinTone(styles, styleId, toneId),
    temperature: quantizeTemperature(temperature),
    max_new_tokens: clampTokens(maxNewTokens),
    seed: null,
  };
}
