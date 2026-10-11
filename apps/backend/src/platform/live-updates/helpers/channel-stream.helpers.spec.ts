import { EventEmitter, on } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  channelStream,
  mapChannelStream,
} from '@/platform/live-updates/helpers/channel-stream.helpers';

const eventSchema = z.object({ messageId: z.string() });

const quietChannel = 'quiet';

const messagesOf = async function* (
  ...messages: readonly string[]
): AsyncGenerator<unknown[], void, undefined> {
  for (const message of messages) {
    yield [message];
  }
};

describe('channelStream', () => {
  it('parses each message with the channel schema', async () => {
    const release = vi.fn<() => Promise<void>>(() => Promise.resolve());
    const stream = channelStream(
      messagesOf(JSON.stringify({ messageId: 'first' }), JSON.stringify({ messageId: 'second' })),
      eventSchema,
      release,
    );

    const events: unknown[] = [];
    for await (const event of stream) {
      events.push(event);
    }

    expect(events).toEqual([{ messageId: 'first' }, { messageId: 'second' }]);
    expect(release).toHaveBeenCalledOnce();
  });

  it('releases the channel when the consumer stops early', async () => {
    const release = vi.fn<() => Promise<void>>(() => Promise.resolve());
    const stream = channelStream(
      messagesOf(JSON.stringify({ messageId: 'first' }), JSON.stringify({ messageId: 'second' })),
      eventSchema,
      release,
    );

    expect((await stream.next()).value).toEqual({ messageId: 'first' });
    await stream.return();

    expect(release).toHaveBeenCalledOnce();
  });

  it('releases the channel when a message does not match the schema', async () => {
    const release = vi.fn<() => Promise<void>>(() => Promise.resolve());
    const stream = channelStream(messagesOf(JSON.stringify({ other: 1 })), eventSchema, release);

    await expect(stream.next()).rejects.toThrow(z.ZodError);
    expect(release).toHaveBeenCalledOnce();
  });
});

describe('mapChannelStream', () => {
  it('maps each event and releases the channel when the consumer stops early', async () => {
    const release = vi.fn<() => Promise<void>>(() => Promise.resolve());
    const events = channelStream(
      messagesOf(JSON.stringify({ messageId: 'first' }), JSON.stringify({ messageId: 'second' })),
      eventSchema,
      release,
    );
    const views = mapChannelStream(events, ({ messageId }) => messageId.toUpperCase());

    expect((await views.next()).value).toBe('FIRST');
    await views.return();

    expect(release).toHaveBeenCalledOnce();
  });

  it('releases the channel and ends a waiting read when the consumer stops before any event', async () => {
    const release = vi.fn<() => Promise<void>>(() => Promise.resolve());
    const emitter = new EventEmitter();
    const events = channelStream(on(emitter, quietChannel), eventSchema, release);
    const views = mapChannelStream(events, ({ messageId }) => messageId.toUpperCase());

    const pending = views.next();
    await views.return();

    await expect(pending).resolves.toEqual({ done: true, value: undefined });
    expect(release).toHaveBeenCalledOnce();
    expect(emitter.listenerCount(quietChannel)).toBe(0);
  });
});
