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
  readonly updatedByUserId: string;
}

export interface ChannelSettingsPatch {
  readonly agentId: string;
  readonly showTyping: boolean;
  readonly updatedAt: Date;
  readonly updatedByUserId: string;
}

export interface ChannelView {
  readonly id: string;
  readonly kind: ChannelRecord['kind'];
  readonly status: ChannelRecord['status'];
  readonly agentId: string | null;
  readonly displayName: string;
  readonly firstName: string | null;
  readonly tokenMasked: string | null;
  readonly updatedByName: string | null;
  readonly showTyping: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ConnectTelegramInput {
  readonly token: string;
  readonly agentId: string;
  readonly showTyping: boolean;
}

export interface ChannelIdInput {
  readonly id: string;
}

export interface PrepareChannelConnectionInput {
  readonly workspaceId: string;
  readonly kind: ChannelRecord['kind'];
  readonly agentId: string;
  readonly externalId: string;
  readonly identity: ChannelIdentity;
  readonly showTyping: boolean;
  readonly credentialsSealed: string;
  readonly createdByUserId: string;
  readonly updatedByUserId: string;
}

export interface CompleteChannelConnectionInput {
  readonly workspaceId: string;
  readonly channelId: string;
  readonly updatedByUserId: string;
}

export interface UpdateTelegramChannelInput {
  readonly id: string;
  readonly agentId: string;
  readonly showTyping: boolean;
}

export interface UpdateChannelSettingsInput {
  readonly workspaceId: string;
  readonly channelId: string;
  readonly agentId: string;
  readonly showTyping: boolean;
  readonly updatedByUserId: string;
}
