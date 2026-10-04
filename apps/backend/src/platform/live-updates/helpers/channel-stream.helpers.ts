import type { z } from 'zod';
import type { ChannelEvent } from '@/platform/live-updates/typedefs/channel.typedefs';

export async function* channelStream<TEvent extends ChannelEvent>(
  messages: AsyncIterator<unknown[]>,
  schema: z.ZodType<TEvent>,
  release: () => Promise<void>,
): AsyncGenerator<TEvent, void, undefined> {
  try {
    for (let result = await messages.next(); result.done !== true; result = await messages.next()) {
      const [message] = result.value;
      yield schema.parse(JSON.parse(String(message)));
    }
  } finally {
    await messages.return?.();
    await release();
  }
}
