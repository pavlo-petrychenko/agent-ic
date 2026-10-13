import { USER_NAME_MAX_LENGTH, USER_NAME_PATTERN } from '@agent-ic/contracts';
import { z } from 'zod';

interface UpdateMyNameSchemaMessages {
  readonly name: string;
}

export const createSignUpSchema = (messages: UpdateMyNameSchemaMessages) =>
  z.object({
    name: z
      .string()
      .trim()
      .max(USER_NAME_MAX_LENGTH, messages.name)
      .regex(USER_NAME_PATTERN, messages.name),
  });
