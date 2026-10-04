import type { z } from 'zod';

export type ChannelEventValue = string | number | boolean | null;

export type ChannelEvent = Readonly<Record<string, ChannelEventValue>>;

export interface ChannelDefinition<TEvent extends ChannelEvent> {
  readonly name: string;
  readonly schema: z.ZodType<TEvent>;
}

export interface Channel<TEvent extends ChannelEvent> {
  readonly key: string;
  readonly schema: z.ZodType<TEvent>;
}
