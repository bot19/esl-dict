import logData from "../logData";
import { Context } from "../Context";

const logErrors = async <T>(ctx: Context, fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (err: any) {
    logData(
      {
        path: ctx.path,
        type: err.constructor.name,
        message: err.message,
      },
      "promise-error",
    );
    throw err;
  }
};

export const withErrorLog =
  (ctx: Context) =>
  <T extends unknown[], U>(fn: (...args: T) => Promise<U>) =>
  (...args: T) =>
    logErrors(ctx, () => fn(...args));
