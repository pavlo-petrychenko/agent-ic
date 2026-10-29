import { ChannelKind } from '@agent-ic/contracts';
import { ChannelType } from '@agent-ic/flow';

export const CHANNEL_KIND_OF_TYPE: Readonly<Record<ChannelType, ChannelKind>> = {
  [ChannelType.Telegram]: ChannelKind.Telegram,
  [ChannelType.Api]: ChannelKind.Api,
};
