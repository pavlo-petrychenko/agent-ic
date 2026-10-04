import type { z } from 'zod';
import { TOPIC_ROOT, TOPIC_SEGMENT_SEPARATOR } from '@/platform/pubsub/pubsub.constants';
import type { TopicEvent } from '@/platform/pubsub/pubsub.typedefs';

export abstract class Topic<TEvent extends TopicEvent> {
  protected abstract readonly name: string;
  abstract readonly schema: z.ZodType<TEvent>;
  private readonly segments: readonly string[];

  constructor(...segments: readonly string[]) {
    this.segments = segments;
  }

  get channel(): string {
    return [TOPIC_ROOT, this.name, ...this.segments].join(TOPIC_SEGMENT_SEPARATOR);
  }
}
