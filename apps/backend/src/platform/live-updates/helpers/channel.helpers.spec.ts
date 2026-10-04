import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  CHANNEL_KEY_ROOT,
  CHANNEL_KEY_SEPARATOR,
} from '@/platform/live-updates/constants/channel.constants';
import { channelFor, defineChannel } from '@/platform/live-updates/helpers/channel.helpers';

const eventSchema = z.object({ messageId: z.string() });

describe('defineChannel', () => {
  it('returns a frozen definition', () => {
    const channel = defineChannel({ name: 'conversation', schema: eventSchema });

    expect(channel).toEqual({ name: 'conversation', schema: eventSchema });
    expect(Object.isFrozen(channel)).toBe(true);
  });
});

describe('channelFor', () => {
  it('keys the channel by the root, its name and the segments', () => {
    const definition = defineChannel({ name: 'conversation', schema: eventSchema });

    const channel = channelFor(definition, 'wsp_1', 'cnv_1');

    expect(channel.key).toBe(
      [CHANNEL_KEY_ROOT, 'conversation', 'wsp_1', 'cnv_1'].join(CHANNEL_KEY_SEPARATOR),
    );
    expect(channel.schema).toBe(eventSchema);
  });
});
