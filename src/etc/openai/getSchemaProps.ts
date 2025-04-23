import { ZodType } from "zod";
import { removeJsonSchemaConstraints } from "./removeJsonSchemaConstraints";
import zodToJsonSchema from "zod-to-json-schema";
import { validate } from "./validate";
import { Inputs } from "./types";

export const getSchemaProps = (schema: ZodType, plainText?: boolean) => {
  let responseFormat: Inputs["responseFormat"] = undefined;

  if (!plainText) {
    const jsonSchema = removeJsonSchemaConstraints(
      zodToJsonSchema(schema, "schema").definitions!.schema,
    );

    responseFormat = {
      type: "json_schema",
      json_schema: {
        name: "response",
        schema: jsonSchema,
      },
    };
  }

  return {
    responseFormat,
    validate: validate(schema, plainText),
  };
};
