import { z } from 'zod';
import { NodeType } from '@flow/document/constants/flow.constants';
import type { FlowNode, OutputField } from '@flow/document/typedefs/flow.typedefs';
import {
  AGENT_MESSAGES_FIELD_NAME,
  OutputFieldType,
} from '@flow/outputs/constants/output.constants';

const AGENT_MESSAGES_FIELD: OutputField = {
  name: AGENT_MESSAGES_FIELD_NAME,
  type: OutputFieldType.StringList,
  description: '',
  required: true,
};

const NO_FIELDS: readonly OutputField[] = [];

export const nodeOutputFields = (node: FlowNode): readonly OutputField[] => {
  if (node.type === NodeType.Agent) {
    return [AGENT_MESSAGES_FIELD, ...node.config.output];
  }
  if (node.type === NodeType.Completion) {
    return node.config.output;
  }
  return NO_FIELDS;
};

export const outputFieldTypes = (node: FlowNode): Readonly<Record<string, OutputFieldType>> =>
  Object.fromEntries(nodeOutputFields(node).map((field) => [field.name, field.type]));

const fieldSchema = (field: OutputField): z.ZodType => {
  switch (field.type) {
    case OutputFieldType.String:
      return z.string();
    case OutputFieldType.Number:
      return z.number();
    case OutputFieldType.Boolean:
      return z.boolean();
    case OutputFieldType.StringList:
      return z.array(z.string());
    case OutputFieldType.Enum:
      return z.enum(field.values);
  }
};

const describedField = (field: OutputField): z.ZodType => {
  const schema = fieldSchema(field);
  const described = field.description.length > 0 ? schema.describe(field.description) : schema;
  return field.required ? described : described.optional();
};

export const outputToZod = (fields: readonly OutputField[]): z.ZodObject =>
  z.object(Object.fromEntries(fields.map((field) => [field.name, describedField(field)])));
