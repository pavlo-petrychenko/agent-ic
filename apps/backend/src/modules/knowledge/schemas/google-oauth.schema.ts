import { z } from 'zod';
import {
  GOOGLE_OAUTH_CODE_MAX_LENGTH,
  GOOGLE_OAUTH_CODE_VERIFIER_MAX_LENGTH,
  GOOGLE_OAUTH_CODE_VERIFIER_MIN_LENGTH,
  GOOGLE_OAUTH_STATE_MAX_LENGTH,
} from '@/modules/knowledge/constants/google-oauth.constants';

export const googleOAuthStateSchema = z.object({
  workspaceId: z.uuid(),
  userId: z.uuid(),
  codeVerifier: z
    .string()
    .min(GOOGLE_OAUTH_CODE_VERIFIER_MIN_LENGTH)
    .max(GOOGLE_OAUTH_CODE_VERIFIER_MAX_LENGTH),
});

export const completeGoogleConnectionInputSchema = z.object({
  state: z.string().trim().min(1).max(GOOGLE_OAUTH_STATE_MAX_LENGTH),
  code: z.string().trim().min(1).max(GOOGLE_OAUTH_CODE_MAX_LENGTH),
});

export const disconnectGoogleConnectionInputSchema = z.object({
  id: z.string().min(1),
});
