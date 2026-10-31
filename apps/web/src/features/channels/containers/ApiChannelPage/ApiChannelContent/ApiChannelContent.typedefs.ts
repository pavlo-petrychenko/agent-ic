import type { ApiChannelView } from '@/features/channels/typedefs/apiChannel.typedefs';
import type { ChannelAgent } from '@/features/channels/typedefs/channels.typedefs';

export interface ApiChannelContentProps {
  readonly workspaceId: string;
  readonly channel: ApiChannelView;
  readonly agents: readonly ChannelAgent[];
}
