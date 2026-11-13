import type { StyleOption } from "../api/types";

export function formatElapsed(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "unknown";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const seconds = ms / 1000;
  return `${seconds.toFixed(seconds >= 10 ? 0 : 1)} s`;
}

export function styleCaption(
  styles: readonly StyleOption[],
  styleId: string,
  toneId: string | null,
): string {
  const style = styles.find((item) => item.id === styleId);
  const styleName = style?.label ?? styleId;
  if (!toneId) return styleName;
  const toneName = style?.substyles?.find((item) => item.id === toneId)?.label ?? toneId;
  return `${styleName} · ${toneName}`;
}
