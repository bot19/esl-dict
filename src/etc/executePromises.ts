export const executePromises = async <T>(promises: Promise<T>[]) => {
  const results = await Promise.allSettled(promises);

  return results.map((r) => {
    if (r.status === "rejected") throw r.reason;
    return r.value;
  });
};
