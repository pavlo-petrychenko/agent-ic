import { z } from 'zod';

export const googleOAuthTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1).optional(),
  expires_in: z.number().int().positive(),
  scope: z.string().min(1),
});

export const googleOAuthUserInfoSchema = z.object({
  sub: z.string().min(1),
  email: z.email(),
});
