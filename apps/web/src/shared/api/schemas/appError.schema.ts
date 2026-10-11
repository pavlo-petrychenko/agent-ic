import { z } from 'zod';

const fieldIssueSchema = z.object({
  path: z.string(),
  reason: z.string(),
});

export const errorPayloadSchema = z.object({
  code: z.string().nullish(),
  reason: z.string().nullish(),
  traceId: z.string().nullish(),
  fields: z.array(fieldIssueSchema).nullish(),
  errors: z.array(fieldIssueSchema).nullish(),
  detail: z.string().nullish(),
  details: z.record(z.string(), z.unknown()).nullish(),
});

export type ErrorPayload = z.infer<typeof errorPayloadSchema>;
