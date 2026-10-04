import { z } from 'zod';

export const accessTokenPayloadSchema = z.object({
  sub: z.string().min(1),
  sid: z.string().min(1),
});
