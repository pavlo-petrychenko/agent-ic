import { z } from 'zod';
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_ENUM_VALUES,
  MAX_LABEL_LENGTH,
  MAX_OUTPUT_FIELDS,
  OUTPUT_FIELD_NAME_PATTERN,
} from '../../limits/constants/limit.constants';
import { OutputFieldType } from '../constants/output.constants';

const fieldShape = {
  name: z.string().regex(OUTPUT_FIELD_NAME_PATTERN),
  description: z.string().max(MAX_DESCRIPTION_LENGTH),
  required: z.boolean(),
};

export const outputFieldSchema = z.discriminatedUnion('type', [
  z.object({ ...fieldShape, type: z.literal(OutputFieldType.String) }),
  z.object({ ...fieldShape, type: z.literal(OutputFieldType.Number) }),
  z.object({ ...fieldShape, type: z.literal(OutputFieldType.Boolean) }),
  z.object({ ...fieldShape, type: z.literal(OutputFieldType.StringList) }),
  z.object({
    ...fieldShape,
    type: z.literal(OutputFieldType.Enum),
    values: z.array(z.string().min(1).max(MAX_LABEL_LENGTH)).min(1).max(MAX_ENUM_VALUES),
  }),
]);

export const outputFieldsSchema = z.array(outputFieldSchema).max(MAX_OUTPUT_FIELDS);
