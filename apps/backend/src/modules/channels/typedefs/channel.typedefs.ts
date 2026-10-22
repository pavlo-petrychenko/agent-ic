import type { channels } from '@/modules/channels/db/channels.table';
import type {
  ChannelCredentials,
  ChannelIdentity,
} from '@/modules/channels/typedefs/channel-identity.typedefs';

export type ChannelRecord = typeof channels.$inferSelect;

export type NewChannel = typeof channels.$inferInsert;

export type { ChannelCredentials, ChannelIdentity };

export interface ChannelPatch {
  readonly status: ChannelRecord['status'];
  readonly agentId: string | null;
  readonly identity: ChannelIdentity;
  readonly showTyping: boolean;
  readonly credentialsSealed: string;
  readonly updatedAt: Date;
}
