import { first } from "lodash";
import { Extra, Inputs } from "./types";
import OpenAI from "openai";
import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";
import { ProviderId } from "@/etc/types";
import { models } from "@/etc/models";
import dotenv from "dotenv";
dotenv.config();

const clients: Record<ProviderId, OpenAI> = {
  openai: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),

  google: new OpenAI({
    baseURL: "https://generativelanguage.googleapis.com/v1beta/",
    apiKey: process.env.GEMINI_API_KEY,
  }),

  anthropic: new OpenAI({
    baseURL: "https://api.anthropic.com/v1",
    apiKey: process.env.ANTHROPIC_API_KEY,
  }),
};

export const rawCgptCall = async (
  { prompt, ...inputs }: Inputs,
  {
    ctx,
    maxTokens,
    model = ["gpt-4o"],
    minTemp = 0,
    maxTemp = 0.8,
    retries = 5,
    promptLang,
    ...extra
  }: Extra,
) => {
  extra.onStart?.();
  const currentRetry = extra.retryCounter?.getCount() ?? 0;
  if (maxTemp <= minTemp) throw Error("incompatible min and max temp");
  const systemMessages: ChatCompletionSystemMessageParam[] = [];

  if (promptLang) {
    systemMessages.push({
      role: "system",
      content: `Translate promtps into ${promptLang} before responding`,
    });
  }

  const modelToUse = Array.isArray(model)
    ? model[Math.min(currentRetry, model.length - 1)]
    : model;

  const response = await clients[
    models[modelToUse].provider
  ].chat.completions.create({
    messages: [
      ...systemMessages,
      { role: "user", content: prompt.replace("\n\n", ":   ") },
    ],
    model: modelToUse,
    max_tokens: maxTokens,
    response_format: inputs.responseFormat ?? { type: "text" },
    temperature: minTemp + (maxTemp - minTemp) * (currentRetry / retries),
    n: 1, // Ensure only one choice is returned
  });

  const { usage } = response;
  const tokensOut = usage?.completion_tokens;
  ctx.logTokens(modelToUse, usage?.prompt_tokens, tokensOut);
  const content = first(response.choices)!.message.content;

  if (maxTokens && tokensOut && tokensOut >= maxTokens) {
    throw new Error(
      `cgpt response truncated at ${tokensOut} tokens: ${content}`,
    );
  }

  if (content === null) throw new Error();
  if (ctx.debugMode) ctx.logger.debug({ prompt, content });

  try {
    extra.validate?.(content);
  } catch (err) {
    ctx.logger.err(`invalid response: ${content}`);
    throw err;
  }

  return content;
};
