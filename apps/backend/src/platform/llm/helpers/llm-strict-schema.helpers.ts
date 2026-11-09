import type { JSONSchema7 } from 'ai';
import type { LlmSchemaDefinition } from '@/platform/llm/typedefs/llm-strict-schema.typedefs';

const NULL_SCHEMA: JSONSchema7 = { type: 'null' };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const acceptsNull = (schema: LlmSchemaDefinition): boolean => {
  if (typeof schema === 'boolean') {
    return schema;
  }
  const { type, anyOf = [] } = schema;
  return (
    type === 'null' || (Array.isArray(type) && type.includes('null')) || anyOf.some(acceptsNull)
  );
};

const strictDefinition = (schema: LlmSchemaDefinition): LlmSchemaDefinition =>
  typeof schema === 'boolean' ? schema : strictJsonSchema(schema);

const nullable = (schema: LlmSchemaDefinition): LlmSchemaDefinition =>
  acceptsNull(schema) ? schema : { anyOf: [schema, NULL_SCHEMA] };

export const strictJsonSchema = (schema: JSONSchema7): JSONSchema7 => {
  const { properties, items, anyOf } = schema;
  const required = new Set(schema.required ?? []);
  return {
    ...schema,
    ...(properties === undefined
      ? {}
      : {
          properties: Object.fromEntries(
            Object.entries(properties).map(([key, property]) => [
              key,
              required.has(key) ? strictDefinition(property) : nullable(strictDefinition(property)),
            ]),
          ),
          required: Object.keys(properties),
        }),
    ...(items === undefined || Array.isArray(items) ? {} : { items: strictDefinition(items) }),
    ...(anyOf === undefined ? {} : { anyOf: anyOf.map(strictDefinition) }),
  };
};

export const withoutOptionalNulls = (value: unknown, schema: LlmSchemaDefinition): unknown => {
  if (typeof schema === 'boolean') {
    return value;
  }
  const { properties, items } = schema;
  if (Array.isArray(value)) {
    return items === undefined || Array.isArray(items)
      ? value
      : value.map((item) => withoutOptionalNulls(item, items));
  }
  if (!isRecord(value) || properties === undefined) {
    return value;
  }
  const required = new Set(schema.required ?? []);
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, item]) => {
      const property = properties[key];
      if (property === undefined) {
        return [[key, item]];
      }
      if (item === null && !required.has(key) && !acceptsNull(property)) {
        return [];
      }
      return [[key, withoutOptionalNulls(item, property)]];
    }),
  );
};
