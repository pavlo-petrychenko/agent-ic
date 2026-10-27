import { ErrorReason } from '@agent-ic/contracts';
import type { z } from 'zod';
import { CHANNEL_FIELD_REASON } from '@/modules/channels/constants/channel-input.constants';
import { InvalidChannelInputError } from '@/modules/channels/errors/invalid-channel-input.error';
import type { FieldIssue } from '@/platform/errors/typedefs/domain-error.typedefs';

const FIELD_PATH_SEPARATOR = '.';

const toFieldIssue = (issue: z.core.$ZodIssue): FieldIssue => ({
  path: issue.path.map(String).join(FIELD_PATH_SEPARATOR),
  reason: CHANNEL_FIELD_REASON[String(issue.path[0] ?? '')] ?? ErrorReason.InvalidRequest,
});

export const parseChannelInput = <TOutput>(schema: z.ZodType<TOutput>, input: unknown): TOutput => {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new InvalidChannelInputError(result.error.issues.map(toFieldIssue));
  }
  return result.data;
};
