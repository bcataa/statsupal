import type { AiProvider, ChatMessage } from "@/lib/ai/provider";
import type { AiEnv } from "@/lib/ai/env";

export function createOpenAiProvider(env: AiEnv): AiProvider {
  return {
    async complete(messages: ChatMessage[]) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: env.model,
          temperature: env.temperature,
          max_tokens: env.maxOutputTokens,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: AbortSignal.timeout(45_000),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`OpenAI HTTP ${res.status}: ${errText.slice(0, 200)}`);
      }

      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = json.choices?.[0]?.message?.content?.trim() ?? "";
      if (!text) {
        throw new Error("Empty AI response");
      }
      return { text };
    },
  };
}
