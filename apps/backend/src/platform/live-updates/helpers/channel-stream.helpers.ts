import type { z } from 'zod';
import type {
  ChannelEvent,
  ChannelStream,
} from '@/platform/live-updates/typedefs/channel.typedefs';

const finished = (): IteratorReturnResult<void> => ({ done: true, value: undefined });

export function channelStream<TEvent extends ChannelEvent>(
  messages: AsyncIterator<unknown[]>,
  schema: z.ZodType<TEvent>,
  release: () => Promise<void>,
): ChannelStream<TEvent> {
  let closed = false;
  const close = async (): Promise<void> => {
    if (closed) {
      return;
    }
    closed = true;
    try {
      await messages.return?.();
    } finally {
      await release();
    }
  };
  const read = async (): Promise<IteratorResult<TEvent, void>> => {
    const result = await messages.next();
    if (result.done === true) {
      return finished();
    }
    const [message] = result.value;
    return { done: false, value: schema.parse(JSON.parse(String(message))) };
  };
  const stream: ChannelStream<TEvent> = {
    async next() {
      if (closed) {
        return finished();
      }
      try {
        const result = await read();
        if (result.done === true) {
          await close();
        }
        return result;
      } catch (error) {
        await close();
        throw error;
      }
    },
    async return() {
      await close();
      return finished();
    },
    [Symbol.asyncIterator]() {
      return stream;
    },
  };
  return stream;
}

export function mapChannelStream<TEvent extends ChannelEvent, TView>(
  events: ChannelStream<TEvent>,
  toView: (event: TEvent) => TView,
): ChannelStream<TView> {
  const stream: ChannelStream<TView> = {
    async next() {
      const result = await events.next();
      return result.done === true ? finished() : { done: false, value: toView(result.value) };
    },
    async return() {
      await events.return();
      return finished();
    },
    [Symbol.asyncIterator]() {
      return stream;
    },
  };
  return stream;
}
