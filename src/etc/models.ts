export const models = {
  "gpt-4o": { pricing: { in: 2.5, out: 10 }, provider: "openai" },
  "gpt-4o-2024-11-20": { pricing: { in: 2.5, out: 10 }, provider: "openai" },
  "gpt-4o-2024-08-06": { pricing: { in: 2.5, out: 10 }, provider: "openai" },
  "gpt-4o-mini": { pricing: { in: 0.15, out: 0.6 }, provider: "openai" },
  "gpt-4o-mini-2024-07-18": {
    pricing: { in: 0.15, out: 0.6 },
    provider: "openai",
  },
  "gemini-2.0-flash": { pricing: { in: 0.1, out: 0.7 }, provider: "google" },
  "claude-3.5-sonnet": { pricing: { in: 3, out: 15 }, provider: "anthropic" },
  "claude-3.5-haiku": { pricing: { in: 0.8, out: 4 }, provider: "anthropic" },
} as const;
