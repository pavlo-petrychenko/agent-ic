import type { z } from 'zod';

import type { TopicEvent } from './pubsub.typedefs';

export class TopicIterator<TEvent extends TopicEvent> implements AsyncIterableIterator<TEvent> {
  private released = false;

  constructor(
    private readonly messages: AsyncIterator<unknown[]>,
    private readonly schema: z.ZodType<TEvent>,
    private readonly release: () => Promise<void>,
  ) {}

  async next(): Promise<IteratorResult<TEvent>> {
    const result = await this.messages.next();
    if (result.done === true) {
      await this.close();
      return { done: true, value: undefined };
    }
    const [message] = result.value;
    return { done: false, value: this.schema.parse(JSON.parse(String(message))) };
  }

  async return(): Promise<IteratorResult<TEvent>> {
    await this.messages.return?.();
    await this.close();
    return { done: true, value: undefined };
  }

  async throw(error?: unknown): Promise<IteratorResult<TEvent>> {
    await this.return();
    throw error instanceof Error ? error : new Error(String(error));
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<TEvent> {
    return this;
  }

  private async close(): Promise<void> {
    if (this.released) {
      return;
    }
    this.released = true;
    await this.release();
  }
}
