import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_NAME_PATTERN,
} from '@agent-ic/contracts';
import { z } from 'zod';

interface SignUpSchemaMessages {
  readonly name: string;
  readonly email: string;
  readonly passwordTooShort: string;
  readonly passwordTooLong: string;
}

export const createSignUpSchema = (messages: SignUpSchemaMessages) =>
  z.object({
    name: z
      .string()
      .trim()
      .max(USER_NAME_MAX_LENGTH, messages.name)
      .regex(USER_NAME_PATTERN, messages.name),
    email: z.email(messages.email),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, messages.passwordTooShort)
      .max(PASSWORD_MAX_LENGTH, messages.passwordTooLong),
  });
