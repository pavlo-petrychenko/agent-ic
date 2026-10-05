import { z } from 'zod';
import { MAX_LABEL_LENGTH, MAX_TEMPLATE_LENGTH } from '@flow/limits/constants/limit.constants';

export const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const templateSchema = z.string().max(MAX_TEMPLATE_LENGTH);

export const variablePathSchema = z.string().max(MAX_TEMPLATE_LENGTH);

export const nodeBaseShape = {
  id: z.string().min(1),
  key: z.string(),
  label: z.string().max(MAX_LABEL_LENGTH),
  position: positionSchema,
};
