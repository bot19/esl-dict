import { entries, round } from "lodash";
import { Context } from "./Context";
import { models } from "@/etc/models";
import { ModelId } from "@/etc/types";

const format = (amount: number) => `~ $${round(amount, 2)} USD`;

export const costReport = (ctx: Context, multiplier = 1) => {
  let cost = 0;

  for (const [model, tokens] of entries(ctx.tokens)) {
    const modelConfig = models[model as ModelId];

    if (!modelConfig) {
      throw Error(`no pricing information for model: ${model}`);
    }

    cost +=
      modelConfig.pricing.in * (tokens.in / 1000000) +
      modelConfig.pricing.out * (tokens.out / 1000000);
  }

  return format(cost * multiplier);
};
