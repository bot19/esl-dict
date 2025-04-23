import { Context } from "../Context";

const enrichErrors = async <T>(
  ctx: Context,
  fn: () => Promise<T>,
  key: string,
  prompt: string,
): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    throw new Error(
      `error: ${JSON.stringify({ path: ctx.path, key, prompt, message: `${err}` })}`,
    );
  }
};

export const withContextualErrors =
  (ctx: Context, key: string, prompt: string) =>
  <T extends unknown[], U>(fn: (...args: T) => Promise<U>) =>
  (...args: T) =>
    enrichErrors(ctx, () => fn(...args), key, prompt);
