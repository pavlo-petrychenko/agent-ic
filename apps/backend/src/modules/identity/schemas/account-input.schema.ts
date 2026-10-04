import {
  EMAIL_MAX_LENGTH,
  Locale,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_NAME_PATTERN,
} from '@agent-ic/contracts';
import { z } from 'zod';
import { AccountField } from '@/modules/identity/constants/account-input.constants';

const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(EMAIL_MAX_LENGTH));
const tokenSchema = z.string().min(1);

export const signUpInputSchema = z.object({
  [AccountField.Name]: z.string().trim().min(1).max(USER_NAME_MAX_LENGTH).regex(USER_NAME_PATTERN),
  [AccountField.Email]: emailSchema,
  [AccountField.Password]: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
  [AccountField.Locale]: z.enum(Locale),
});

export const loginInputSchema = z.object({
  [AccountField.Email]: emailSchema,
  [AccountField.Password]: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});

export const confirmEmailInputSchema = z.object({
  [AccountField.Token]: tokenSchema,
});

export const resendConfirmationInputSchema = z.union([
  z.object({ [AccountField.Email]: emailSchema, [AccountField.Token]: z.null() }),
  z.object({ [AccountField.Email]: z.null(), [AccountField.Token]: tokenSchema }),
]);
