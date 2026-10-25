import { z } from 'zod';
import { actorSchema } from '@/platform/context/schemas/actor.schema';
import {
  DETACHED_TRACE_CONTEXT,
  ENVELOPE_VERSION,
} from '@/platform/queues/constants/job.constants';
import type { JobEnvelope, JobTraceContext } from '@/platform/queues/typedefs/job.typedefs';

const jobDataValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.string()).readonly(),
]);

export const jobTraceContextSchema: z.ZodType<JobTraceContext> = z
  .record(z.string(), z.string())
  .catch(DETACHED_TRACE_CONTEXT);

export const jobEnvelopeSchema: z.ZodType<JobEnvelope> = z.object({
  version: z.literal(ENVELOPE_VERSION),
  data: z.record(z.string(), jobDataValueSchema),
  workspaceId: z.string().min(1).nullable(),
  traceId: z.string().min(1),
  traceContext: jobTraceContextSchema,
  initiatedBy: actorSchema,
});
