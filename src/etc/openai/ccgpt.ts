import { withDiskCache } from "../../etc/promises/withDiskCache";
import { z, ZodError, ZodIssue, ZodSchema, ZodType } from "zod";
import { rawCgptCall } from "./rawCgptCall";
import { Extra, Inputs } from "./types";
import { withTimeout } from "../../etc/promises/withTimeout";
import { Counter, withRetries } from "../../etc/promises/withRetries";
import { withLimit } from "../../etc/promises/withLimit";
import { withErrorLog } from "../../etc/promises/withErrorLog";
import { getSchemaProps } from "./getSchemaProps";
import { flow } from "fp-ts/lib/function";
import { parse } from "./parse";
import { withContextualErrors } from "../promises/withContextualErrors";
import { hashJson } from "../hashJson";

export interface CcgptOptions
  extends Omit<Inputs, "responseFormat">,
    Omit<Extra, "onStart"> {
  schema: ZodSchema;
  plainText?: boolean;
}

class CgptError extends ZodError {
  constructor(
    issues: ZodIssue[],
    public response: string
  ) {
    super(issues);
  }
}

// NOTE rate limting. Might need to experiment with this.
const limit = withLimit(1000, 20);

export const ccgpt = async <S extends ZodType>(
  name: string,
  { ctx, schema, prompt, plainText, retries = 5, ...props }: CcgptOptions
): Promise<z.infer<S>> => {
  name = `cgpt.${name}`;
  ctx = ctx.step(name);
  const { responseFormat, ...schemaProps } = getSchemaProps(schema, plainText);
  const retryCounter = new Counter();
  const inputs = { prompt, responseFormat };
  const key = hashJson(inputs);

  const cgptCallWithDecorators = withDiskCache(
    flow(
      withTimeout(180000),
      limit,
      withErrorLog(ctx),
      withRetries(ctx, retries, retryCounter),
      withContextualErrors(ctx, key, prompt)
    )(rawCgptCall)
  );

  const { data } = (await cgptCallWithDecorators({
    ctx,
    cacheId: name,
    inputs,
    extra: {
      ctx,
      retryCounter,
      onStart: () => ctx.logger.log("tx"),
      retries,
      ...schemaProps,
      ...props,
    },
  })) as { data: string }; // Add type assertion here

  try {
    return parse(schema, Boolean(plainText), data, {
      path: ctx.path,
      key,
      name,
      prompt,
    }) as z.infer<S>; // Add type assertion here
  } catch (err) {
    if (err instanceof ZodError) {
      throw new CgptError(err.issues, data);
    }

    throw err;
  }
};
