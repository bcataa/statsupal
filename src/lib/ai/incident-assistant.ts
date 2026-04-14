import { getAiEnv } from "@/lib/ai/env";
import { createOpenAiProvider } from "@/lib/ai/openai-provider";
import type { AiProvider } from "@/lib/ai/provider";
import { logAiAssistant } from "@/lib/logging/server-log";
import type { Incident } from "@/lib/models/monitoring";

export type IncidentAssistAction =
  | "summarize"
  | "draft_public_update"
  | "likely_cause"
  | "rewrite_customer";

export type IncidentAssistFailure = {
  error: string;
  code: "ai_not_configured" | "ai_error";
};

function getProvider(): AiProvider | null {
  const env = getAiEnv();
  if (!env) {
    return null;
  }
  if (env.provider === "openai") {
    return createOpenAiProvider(env);
  }
  return null;
}

const SAFETY_SYSTEM = `You are a writing assistant for an uptime/status product called Statsupal.
Rules:
- Output plain text or short markdown only. No code execution.
- Do NOT claim you verified live systems or changed any monitoring state.
- Do NOT promise fixes to third-party websites or infrastructure you cannot control.
- Label speculation clearly as speculation. Be concise and professional.
- If information is missing, say what would help.`;

export async function runIncidentAssist(params: {
  action: IncidentAssistAction;
  incident: Incident;
  serviceName: string;
  optionalNotes?: string;
}): Promise<{ text: string } | IncidentAssistFailure> {
  const provider = getProvider();
  if (!provider) {
    return {
      error:
        "AI is not enabled on this server yet. Add STATSUPAL_AI_API_KEY and related variables to the deployment environment (see Settings → AI assistant or the API docs).",
      code: "ai_not_configured",
    };
  }

  const { action, incident, serviceName, optionalNotes } = params;

  const incidentBlock = [
    `Title: ${incident.title}`,
    `Status: ${incident.status}`,
    `Severity: ${incident.severity}`,
    `Affected service: ${serviceName}`,
    incident.description ? `Description: ${incident.description}` : "",
    incident.resolutionSummary ? `Resolution summary: ${incident.resolutionSummary}` : "",
    optionalNotes ? `Author notes: ${optionalNotes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  let userPrompt: string;
  switch (action) {
    case "summarize":
      userPrompt = `Summarize this incident in 2–4 short paragraphs for an internal team reader.\n\n${incidentBlock}`;
      break;
    case "draft_public_update":
      userPrompt = `Draft a customer-facing status update (neutral, reassuring, factual). Do not invent timelines or guarantees.\n\n${incidentBlock}`;
      break;
    case "likely_cause":
      userPrompt = `Suggest plausible causes based only on the text below. Prefix with "Possible causes (speculative):" and use bullets. Do not assert certainty.\n\n${incidentBlock}`;
      break;
    case "rewrite_customer":
      userPrompt = `Rewrite the following into friendly, non-technical language for status page subscribers. Keep it short.\n\n${incidentBlock}`;
      break;
    default:
      return { error: "Unknown action.", code: "ai_error" };
  }

  try {
    const { text } = await provider.complete([
      { role: "system", content: SAFETY_SYSTEM },
      { role: "user", content: userPrompt },
    ]);
    logAiAssistant.info("incident assist completed", { action, incidentId: incident.id });
    return { text };
  } catch (e) {
    logAiAssistant.warn("incident assist failed", {
      action,
      incidentId: incident.id,
      message: e instanceof Error ? e.message : String(e),
    });
    return {
      error: "The AI service did not respond in time or returned an error. Try again in a moment.",
      code: "ai_error",
    };
  }
}

