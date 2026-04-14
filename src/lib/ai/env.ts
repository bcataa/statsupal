export type AiEnv = {
  provider: "openai" | "none";
  apiKey: string;
  model: string;
  temperature: number;
  maxOutputTokens: number;
};

export function getAiEnv(): AiEnv | null {
  const provider = (process.env.STATSUPAL_AI_PROVIDER ?? process.env.AI_PROVIDER ?? "none")
    .trim()
    .toLowerCase();
  if (provider === "none" || provider === "" || provider === "disabled") {
    return null;
  }

  const apiKey =
    process.env.STATSUPAL_AI_API_KEY?.trim() || process.env.AI_API_KEY?.trim() || "";
  if (!apiKey) {
    return null;
  }

  const model =
    process.env.STATSUPAL_AI_MODEL?.trim() ||
    process.env.AI_MODEL?.trim() ||
    "gpt-4o-mini";

  const tempRaw = process.env.STATSUPAL_AI_TEMPERATURE ?? process.env.AI_TEMPERATURE;
  const temperature = tempRaw != null && tempRaw !== "" ? Math.min(1, Math.max(0, Number(tempRaw))) : 0.3;

  const maxRaw = process.env.STATSUPAL_AI_MAX_OUTPUT_TOKENS ?? process.env.AI_MAX_OUTPUT_TOKENS;
  const maxOutputTokens =
    maxRaw != null && maxRaw !== "" ? Math.min(4096, Math.max(256, Number(maxRaw))) : 1024;

  if (provider === "openai") {
    return { provider: "openai", apiKey, model, temperature, maxOutputTokens };
  }

  return null;
}
