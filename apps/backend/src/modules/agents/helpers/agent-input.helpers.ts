import { ErrorReason } from '@agent-ic/contracts';
import type { z } from 'zod';
import {
  AGENT_FIELD_PATH_SEPARATOR,
  AGENT_FIELD_REASON,
} from '@/modules/agents/constants/agent-input.constants';
import { InvalidAgentInputError } from '@/modules/agents/errors/invalid-agent-input.error';
import type { FieldIssue } from '@/platform/errors/typedefs/domain-error.typedefs';

const toFieldIssue = (issue: z.core.$ZodIssue): FieldIssue => ({
  path: issue.path.map(String).join(AGENT_FIELD_PATH_SEPARATOR),
  reason: AGENT_FIELD_REASON[String(issue.path[0] ?? '')] ?? ErrorReason.InvalidRequest,
});

export const parseAgentInput = <TOutput>(schema: z.ZodType<TOutput>, input: unknown): TOutput => {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new InvalidAgentInputError(result.error.issues.map(toFieldIssue));
  }
  return result.data;
};
