const timeout = <T>(promise: Promise<T>, milliseconds: number): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Promise timed out"));
    }, milliseconds);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
};

export const withTimeout =
  (milliseconds: number) =>
  <T extends unknown[], U>(fn: (...args: T) => Promise<U>) =>
  (...args: T) =>
    timeout(fn(...args), milliseconds);
