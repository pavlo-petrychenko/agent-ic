import type { ChannelQuery } from '@/features/channels/communication/gql/query/channel.generated';
import type { ChannelsQuery } from '@/features/channels/communication/gql/query/channels.generated';
import type {
  ApiChannelSummary,
  ApiChannelView,
  ApiReplyMode,
  CreatedApiChannel,
  RotatedApiChannel,
} from '@/features/channels/typedefs/apiChannel.typedefs';
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
  readonly apiChannels: readonly ApiChannelSummary[];
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

export interface UseApiChannelResult {
  readonly channel: ApiChannelView | null;
  readonly loading: boolean;
  readonly failed: boolean;
  readonly retry: () => void;
}

export interface UpdateChannelVariables {
  readonly id: string;
  readonly agentId: string;
  readonly showTyping: boolean | null;
  readonly replyMode: ApiReplyMode | null;
  readonly webhook: string | null;
}

export interface UseUpdateChannelResult {
  readonly updateChannel: (variables: UpdateChannelVariables) => Promise<void>;
  readonly saving: boolean;
}

export interface CreateApiChannelVariables {
  readonly name: string;
  readonly agentId: string;
  readonly replyMode: ApiReplyMode;
  readonly webhook: string | null;
}

export interface UseCreateApiChannelResult {
  readonly createApiChannel: (
    variables: CreateApiChannelVariables,
  ) => Promise<CreatedApiChannel | null>;
  readonly creating: boolean;
}

export interface UseRotateApiChannelKeyResult {
  readonly rotateApiChannelKey: (id: string) => Promise<RotatedApiChannel | null>;
  readonly rotating: boolean;
}
