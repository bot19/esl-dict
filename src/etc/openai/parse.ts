import { ZodSchema } from "zod";
import logData from "../logData";
import { CgptValidationError } from "./types";

export const parse = (
  schema: ZodSchema,
  plainText: boolean,
  response: string,
  info: unknown,
) => {
  const { error, data } = schema.safeParse(
    plainText ? response : JSON.parse(response),
  );

  if (error) {
    logData(
      { info, plainText, response, message: error.message },
      "parse-error",
    );

    throw new CgptValidationError(error.message);
  }

  return data;
};
