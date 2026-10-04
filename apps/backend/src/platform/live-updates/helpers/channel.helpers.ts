import {
  CHANNEL_KEY_ROOT,
  CHANNEL_KEY_SEPARATOR,
} from '@/platform/live-updates/constants/channel.constants';
import type {
  Channel,
  ChannelDefinition,
  ChannelEvent,
} from '@/platform/live-updates/typedefs/channel.typedefs';

export const defineChannel = <TEvent extends ChannelEvent>(
  definition: ChannelDefinition<TEvent>,
): ChannelDefinition<TEvent> => Object.freeze({ ...definition });

export const channelFor = <TEvent extends ChannelEvent>(
  definition: ChannelDefinition<TEvent>,
  ...segments: readonly string[]
): Channel<TEvent> =>
  Object.freeze({
    key: [CHANNEL_KEY_ROOT, definition.name, ...segments].join(CHANNEL_KEY_SEPARATOR),
    schema: definition.schema,
  });
