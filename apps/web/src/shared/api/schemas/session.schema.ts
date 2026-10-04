import { z } from 'zod';

export const sessionTokensSchema = z.object({
  accessToken: z.string().min(1),
  accessTokenExpiresAt: z.iso.datetime(),
});
