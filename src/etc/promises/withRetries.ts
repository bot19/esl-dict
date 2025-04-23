import { Context } from "../Context";

export class Counter {
  private count: number;

  constructor(initialCount: number = 0) {
    this.count = initialCount;
  }

  increment() {
    this.count++;
  }

  getCount() {
    return this.count;
  }
}

function retry<T>(
  ctx: Context,
  fn: () => Promise<T>,
  retries: number,
  counter?: Counter,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const attempt = (n: number) => {
      fn()
        .then(resolve)
        .catch((err) => {
          if (n === 0) {
            ctx.logger.err("retry limit reached");
            reject(err);
          } else {
            counter?.increment();
            ctx.logger.log(`retrying [${retries - n + 1}/${retries}]`);
            attempt(n - 1);
          }
        });
    };

    attempt(retries);
  });
}

export const withRetries =
  (ctx: Context, retries: number, counter?: Counter) =>
  <T extends unknown[], U>(fn: (...args: T) => Promise<U>) =>
  (...args: T) =>
    retry(ctx, () => fn(...args), retries, counter);
