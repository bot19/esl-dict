import { z } from "zod";
import { hashJson } from "../hashJson";
import { Context } from "../Context";
import { identity } from "lodash";

const idSchema = z.string().regex(/^[a-z.\-0-9]+$/);

export interface CacheFnOptions<T, U, V> {
  cacheId: string;
  inputs: T;
  extra: U;
  ctx: Context;
  transform?: (value: V) => V;
}

export const withDiskCache = <T extends object, U, V>(
  fn: (inputs: T, extra: U) => Promise<V>,
) => {
  const cached = async ({
    cacheId,
    ctx,
    transform = identity,
    ...options
  }: CacheFnOptions<T, U, V>) => {
    const keyData = options.inputs;
    const key = hashJson(keyData);
    cacheId = idSchema.parse(cacheId);
    const cache = ctx.getCache(cacheId);
    const cachedData = cache.getKey(key);
    const infoCache = ctx.getCache(`${cacheId}.info`);
    infoCache.getKey(key); // Touch key so it wont get removed.

    if (cachedData !== undefined) {
      return { data: transform(cachedData) as V, fromCache: true, key };
    }

    if (ctx.dryRun) throw new Error(`cache miss during dry run: ${key}`);
    const newData = await fn(options.inputs, options.extra);
    infoCache.setKey(key, JSON.stringify(keyData));
    cache.setKey(key, newData);
    infoCache.save(true);
    cache.save(true);
    return { data: transform(newData), fromCache: false, key };
  };

  return cached;
};
