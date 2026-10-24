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

export interface ChannelView {
  readonly id: string;
  readonly kind: ChannelRecord['kind'];
  readonly status: ChannelRecord['status'];
  readonly agentId: string | null;
  readonly displayName: string;
  readonly showTyping: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ConnectTelegramInput {
  readonly token: string;
  readonly agentId: string;
  readonly showTyping: boolean;
}
