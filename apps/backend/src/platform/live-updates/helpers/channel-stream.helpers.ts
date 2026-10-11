import type { z } from 'zod';
import type {
  ChannelEvent,
  ChannelStream,
} from '@/platform/live-updates/typedefs/channel.typedefs';

const finished = (): IteratorReturnResult<void> => ({ done: true, value: undefined });

const streamOf = <TValue>(
  next: () => Promise<IteratorResult<TValue, void>>,
  stop: () => Promise<unknown>,
): ChannelStream<TValue> => {
  const stream: ChannelStream<TValue> = {
    next,
    return: () => stop().then(finished),
    [Symbol.asyncIterator]: () => stream,
  };
  return stream;
};

export function channelStream<TEvent extends ChannelEvent>(
  messages: AsyncIterator<unknown[]>,
  schema: z.ZodType<TEvent>,
  release: () => Promise<void>,
): ChannelStream<TEvent> {
  let open = true;
  const close = async (): Promise<void> => {
    if (open) {
      open = false;
      await messages.return?.();
      await release();
    }
  };
  const next = async (): Promise<IteratorResult<TEvent, void>> => {
    try {
      const result = await messages.next();
      if (result.done !== true) {
        return { done: false, value: schema.parse(JSON.parse(String(result.value[0]))) };
      }
    } catch (error) {
      await close();
      throw error;
    }
    await close();
    return finished();
  };
  return streamOf(next, close);
}

export function mapChannelStream<TEvent extends ChannelEvent, TView>(
  events: ChannelStream<TEvent>,
  toView: (event: TEvent) => TView,
): ChannelStream<TView> {
  const next = async (): Promise<IteratorResult<TView, void>> => {
    const result = await events.next();
    return result.done === true ? result : { done: false, value: toView(result.value) };
  };
  return streamOf(next, () => events.return());
}
