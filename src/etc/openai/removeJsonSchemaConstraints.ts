import { isArray, isObject, keys } from "lodash";

const constraintsToRemove = [
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "minLength",
  "maxLength",
  "pattern",
  "minItems",
  "maxItems",
  "uniqueItems",
  "minProperties",
  "maxProperties",
  "multipleOf",
  "enum",
  "const",
  "additionalProperties",
  "required",
];

type JSONSchema = { [key: string]: any };

export const removeJsonSchemaConstraints = (
  schema: JSONSchema,
  isPropertyLevel: boolean = false,
): JSONSchema => {
  if (isArray(schema)) {
    return schema.map((item) =>
      removeJsonSchemaConstraints(item, isPropertyLevel),
    );
  } else if (isObject(schema)) {
    return keys(schema).reduce((acc: JSONSchema, key: string) => {
      if (!constraintsToRemove.includes(key) || isPropertyLevel) {
        acc[key] = removeJsonSchemaConstraints(
          schema[key],
          key === "properties",
        );
      }

      return acc;
    }, {});
  } else {
    return schema;
  }
};
