import { cloneDeep, keys } from "lodash";
import { ChatCompletionCreateParamsNonStreaming } from "openai/resources/index.mjs";

const makeAllFieldsRequired = (
  schema?: Record<string, any>,
): Record<string, unknown> => {
  if (!schema || typeof schema !== "object") throw new Error("Invalid schema");

  if (schema.properties) {
    schema.required = keys(schema.properties);
    schema.additionalProperties = false;

    for (const key of keys(schema.properties)) {
      const property = schema.properties[key];

      if (property.type === "object" || property.properties) {
        schema.properties[key] = makeAllFieldsRequired(property);
      }
    }
  }

  return schema;
};

export const makeJsonSchemaCompliant = (
  responseFormat: ChatCompletionCreateParamsNonStreaming["response_format"],
) => {
  if (responseFormat?.type !== "json_schema") return responseFormat;
  const newResponseFormat = cloneDeep(responseFormat);
  newResponseFormat.json_schema.strict = true;
  makeAllFieldsRequired(newResponseFormat.json_schema.schema);
  return newResponseFormat;
};
