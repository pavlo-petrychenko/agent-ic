import { ErrorReason } from '@agent-ic/contracts';
import type { z } from 'zod';
import { SIMULATION_FIELD_PATH_SEPARATOR } from '@/modules/conversations/constants/simulation.constants';
import { InvalidConversationInputError } from '@/modules/conversations/errors/invalid-conversation-input.error';

export const parseConversationInput = <TOutput>(
  schema: z.ZodType<TOutput>,
  input: unknown,
): TOutput => {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new InvalidConversationInputError(
      result.error.issues.map((issue) => ({
        path: issue.path.map(String).join(SIMULATION_FIELD_PATH_SEPARATOR),
        reason: ErrorReason.InvalidRequest,
      })),
    );
  }
  return result.data;
};
