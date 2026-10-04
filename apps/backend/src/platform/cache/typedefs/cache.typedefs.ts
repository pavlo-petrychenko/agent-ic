import type { z } from 'zod';

export interface CacheEntry<TValue> {
  readonly key: string;
  readonly schema: z.ZodType<TValue>;
  readonly ttlSeconds: number;
}

export interface CacheEntryDefinition<TValue> {
  readonly name: string;
  readonly schema: z.ZodType<TValue>;
  readonly ttlSeconds: number;
}
