import type { z } from 'zod';
import { CACHE_KEY_SEPARATOR, CACHE_ROOT } from '@/platform/cache/constants/cache.constants';
import type { CacheEntry, CacheEntryDefinition } from '@/platform/cache/typedefs/cache.typedefs';

export const defineCacheEntry =
  <TValue>(definition: CacheEntryDefinition<TValue>) =>
  (...segments: readonly string[]): CacheEntry<TValue> => ({
    key: [CACHE_ROOT, definition.name, ...segments].join(CACHE_KEY_SEPARATOR),
    schema: definition.schema,
    ttlSeconds: definition.ttlSeconds,
  });

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
