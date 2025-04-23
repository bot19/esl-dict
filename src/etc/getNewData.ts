import confirm from "./confirm";
import logData from "./logData";

async function getNewData<T>(
  description: string,
  fn: () => Promise<T>,
  prompt = false,
) {
  let data: T;

  for (let i = 0; i < 5; i++) {
    try {
      data = await fn();

      if (
        !prompt ||
        (await confirm(`Accept new results for ${description}?`, data))
      ) {
        return data;
      } else {
        throw new Error();
      }
    } catch (err: any) {
      console.log(
        `Something went wrong with ${description} (${typeof err}). Retrying.`,
      );

      logData(
        { type: err.constructor.name, message: err.message },
        description,
      );

      if (prompt && !(await confirm("Retry?"))) break;
    }
  }

  throw new Error("Step failed. Retry limit exceeded");
}

export default getNewData;
