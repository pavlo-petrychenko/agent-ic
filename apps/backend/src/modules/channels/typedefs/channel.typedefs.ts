import type { channels } from '@/modules/channels/db/channels.table';
import type {
  ChannelCredentials,
  ChannelIdentity,
} from '@/modules/channels/typedefs/channel-identity.typedefs';
import type { TelegramUpdate } from '@/modules/channels/typedefs/telegram.typedefs';

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

export interface ChannelCredentialsPatch {
  readonly status: ChannelRecord['status'];
  readonly identity: ChannelIdentity;
  readonly credentialsSealed: string;
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

export interface ReplaceTelegramTokenInput {
  readonly id: string;
  readonly token: string;
}

export interface ReplaceChannelCredentialsInput {
  readonly workspaceId: string;
  readonly channelId: string;
  readonly identity: ChannelIdentity;
  readonly credentialsSealed: string;
  readonly updatedByUserId: string;
}

export interface UpdateChannelSettingsInput {
  readonly workspaceId: string;
  readonly channelId: string;
  readonly agentId: string;
  readonly showTyping: boolean;
  readonly updatedByUserId: string;
}

export interface StoreReconnectCredentialsInput {
  readonly workspaceId: string;
  readonly channelId: string;
  readonly identity: ChannelIdentity;
  readonly credentialsSealed: string;
  readonly updatedByUserId: string;
}

export interface ReceiveTelegramUpdateInput {
  readonly channelId: string;
  readonly update: TelegramUpdate;
  readonly webhookSecret?: string | null;
}

export interface HandleTelegramWebhookInput {
  readonly workspacePublicId: string;
  readonly channelPublicId: string;
  readonly secret: string | null;
  readonly body: unknown;
}
