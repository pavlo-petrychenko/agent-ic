import type { ChannelQuery } from '@/features/channels/communication/gql/query/channel.generated';
import type { ChannelsQuery } from '@/features/channels/communication/gql/query/channels.generated';
import type { ApiReplyMode } from '@/features/channels/typedefs/apiChannel.typedefs';
import type {
  TelegramChannelSummary,
  TelegramChannelView,
} from '@/features/channels/typedefs/telegram.typedefs';

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

export interface UpdateChannelVariables {
  readonly id: string;
  readonly agentId: string;
  readonly showTyping: boolean;
  readonly replyMode: ApiReplyMode | null;
  readonly webhook: string | null;
}

export interface UseUpdateChannelResult {
  readonly updateChannel: (variables: UpdateChannelVariables) => Promise<void>;
  readonly saving: boolean;
}
