import { ZodSchema } from "zod";
import { CgptValidationError } from "./types";

export const validate =
  (schema: ZodSchema, plainText?: boolean) => (text: string) => {
    const validation = schema.safeParse(plainText ? text : JSON.parse(text));

    if (validation.error) {
      throw new CgptValidationError(`problem: ${validation.error.message}`);
    }
  };
