import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { defineCacheEntry } from '@/platform/cache/helpers/cache.helpers';

const TTL_SECONDS = 30;

const sessionEntry = defineCacheEntry({
  name: 'session',
  schema: z.string(),
  ttlSeconds: TTL_SECONDS,
});

describe('defineCacheEntry', () => {
  it('builds a key from the cache root, the name and the segments', () => {
    expect(sessionEntry('workspace', 'user').key).toBe('cache:session:workspace:user');
  });

  it('carries the schema and the ttl of the definition', () => {
    const entry = sessionEntry('user');

    expect(entry.ttlSeconds).toBe(TTL_SECONDS);
    expect(entry.schema.parse('value')).toBe('value');
  });
});
