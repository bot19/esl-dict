import { ChatCompletionCreateParamsNonStreaming } from "openai/resources/index.mjs";
import { Context } from "../Context";
import { Counter } from "../promises/withRetries";
import { ModelId } from "@/etc/types";

export interface Inputs {
  prompt: string;
  responseFormat?: ChatCompletionCreateParamsNonStreaming["response_format"];
}

export interface Extra {
  ctx: Context;
  maxTokens: ChatCompletionCreateParamsNonStreaming["max_tokens"] | null;
  minTemp?: number;
  maxTemp?: number;
  onStart?: () => void;
  validate?: (response: string) => void;
  model?: ModelId | ModelId[];
  retryCounter?: Counter;
  retries?: number;
  promptLang?: string;
}

export class CgptValidationError extends Error {}
