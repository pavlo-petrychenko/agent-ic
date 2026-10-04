import type { z } from 'zod';

export const parseCachedValue = <TValue>(schema: z.ZodType<TValue>, raw: string): TValue | null => {
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }
};
