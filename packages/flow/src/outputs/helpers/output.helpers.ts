import { z } from 'zod';
import { NodeType } from '@flow/document/constants/flow.constants';
import { enabledExits } from '@flow/document/helpers/node.helpers';
import type { AgentNode, FlowNode, OutputField } from '@flow/document/typedefs/flow.typedefs';
import {
  AGENT_MESSAGES_FIELD_NAME,
  AGENT_OUTCOME_CONTINUE,
  AGENT_OUTCOME_FIELD_NAME,
  AGENT_OUTCOME_REASON_FIELD_NAME,
  OutputFieldType,
} from '@flow/outputs/constants/output.constants';

const AGENT_MESSAGES_FIELD: OutputField = {
  name: AGENT_MESSAGES_FIELD_NAME,
  type: OutputFieldType.StringList,
  description: '',
  required: true,
};

const AGENT_OUTCOME_REASON_FIELD: OutputField = {
  name: AGENT_OUTCOME_REASON_FIELD_NAME,
  type: OutputFieldType.String,
  description: '',
  required: true,
};

const NO_FIELDS: readonly OutputField[] = [];

const outcomeFields = (node: AgentNode): readonly OutputField[] => {
  const exits = enabledExits(node);
  if (exits.length === 0) {
    return NO_FIELDS;
  }
  return [
    {
      name: AGENT_OUTCOME_FIELD_NAME,
      type: OutputFieldType.Enum,
      description: '',
      required: true,
      values: [AGENT_OUTCOME_CONTINUE, ...exits],
    },
    AGENT_OUTCOME_REASON_FIELD,
  ];
};

export const nodeOutputFields = (node: FlowNode): readonly OutputField[] => {
  if (node.type === NodeType.Agent) {
    return [AGENT_MESSAGES_FIELD, ...outcomeFields(node), ...node.config.output];
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
