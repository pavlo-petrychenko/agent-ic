import { Readable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { readStream } from '@/platform/storage/helpers/stream.helpers';

describe('readStream', () => {
  it('joins every chunk into one buffer', async () => {
    const body = await readStream(Readable.from([Buffer.from('hello '), Buffer.from('world')]));

    expect(body.toString()).toBe('hello world');
  });
});
