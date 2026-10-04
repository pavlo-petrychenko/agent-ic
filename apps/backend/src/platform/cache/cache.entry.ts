import type { z } from 'zod';

import { CACHE_KEY_SEPARATOR, CACHE_ROOT } from './cache.constants';

export abstract class CacheEntry<TValue> {
  protected abstract readonly name: string;
  abstract readonly schema: z.ZodType<TValue>;
  abstract readonly ttlSeconds: number;
  private readonly segments: readonly string[];

  constructor(...segments: readonly string[]) {
    this.segments = segments;
  }

  get key(): string {
    return [CACHE_ROOT, this.name, ...this.segments].join(CACHE_KEY_SEPARATOR);
  }
}
