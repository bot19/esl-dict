import Bottleneck from "bottleneck";

export const withLimit = (concurrency: number, time: number) => {
  const limiter = new Bottleneck({ maxConcurrent: concurrency, minTime: time });

  return <T extends unknown[], U>(fn: (...args: T) => Promise<U>) =>
    (...args: T) =>
      limiter.schedule(async () => fn(...args));
};
