export type HealthStatus = "loading" | "ready" | "error";

export type HealthResponse = {
  status: HealthStatus;
  model: string;
  device: string;
  gpu_name?: string;
  dtype?: string;
  detail?: string;
};

export type Substyle = {
  id: string;
  label: string;
};

export type StyleOption = {
  id: string;
  label: string;
  description: string;
  substyles: Substyle[] | null;
};

export type StylesResponse = {
  styles: StyleOption[];
};

export type TranslateRequest = {
  text: string;
  style: string;
  linkedin_tone: string | null;
  temperature: number | null;
  max_new_tokens: number | null;
  seed: number | null;
};

export type TranslateResponse = {
  translation: string;
  style: string;
  linkedin_tone: string | null;
  model: string;
  device: string;
  elapsed_ms: number;
  prompt_id?: string;
};
