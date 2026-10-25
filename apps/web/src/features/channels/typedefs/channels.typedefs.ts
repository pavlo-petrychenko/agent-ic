import type { ChannelQuery } from '@/features/channels/communication/gql/query/channel.generated';
import type { ChannelsQuery } from '@/features/channels/communication/gql/query/channels.generated';
import type {
  TelegramChannelSummary,
  TelegramChannelView,
} from '@/features/channels/typedefs/telegramBot.typedefs';

export interface ChannelAgent {
  readonly id: string;
  readonly name: string;
  readonly liveVersionNumber: number | null;
}

export type ChannelSummary = ChannelsQuery['channels'][number];
export type ChannelDetail = NonNullable<ChannelQuery['channel']>;

export interface UseChannelsResult {
  readonly channels: readonly TelegramChannelSummary[];
  readonly loading: boolean;
  readonly failed: boolean;
  readonly retry: () => void;
}

export interface UseChannelResult {
  readonly channel: TelegramChannelView | null;
  readonly loading: boolean;
  readonly failed: boolean;
  readonly retry: () => void;
}
