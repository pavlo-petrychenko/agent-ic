import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@agent-ic/contracts';
import { z } from 'zod';
import { ResetPasswordField } from '@/features/auth/constants/authForm.constants';

interface EmailSchemaMessages {
  readonly email: string;
}

interface ResetPasswordSchemaMessages {
  readonly tooShort: string;
  readonly tooLong: string;
  readonly mismatch: string;
}

export const createEmailSchema = (messages: EmailSchemaMessages) =>
  z.object({ email: z.email(messages.email) });

export const createResetPasswordSchema = (messages: ResetPasswordSchemaMessages) =>
  z
    .object({
      password: z
        .string()
        .min(PASSWORD_MIN_LENGTH, messages.tooShort)
        .max(PASSWORD_MAX_LENGTH, messages.tooLong),
      repeatPassword: z.string(),
    })
    .refine((values) => values.password === values.repeatPassword, {
      message: messages.mismatch,
      path: [ResetPasswordField.RepeatPassword],
    });
