/**
 * AI provider abstraction. Implementations must never mutate monitoring data or call check endpoints.
 */

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type AiProvider = {
  complete: (messages: ChatMessage[]) => Promise<{ text: string }>;
};
