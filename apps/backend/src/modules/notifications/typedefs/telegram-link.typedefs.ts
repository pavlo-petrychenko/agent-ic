export interface TelegramNotificationLinkView {
  readonly code: string;
  readonly botUsername: string;
  readonly expiresAt: Date;
}

export enum TelegramLinkStatus {
  Linked = 'linked',
  Invalid = 'invalid',
  Expired = 'expired',
  AlreadyLinked = 'already_linked',
  NotConfigured = 'not_configured',
}

export interface TelegramLinkResult {
  readonly status: TelegramLinkStatus;
  readonly username: string | null;
}

export interface HandleTelegramAlertsWebhookInput {
  readonly secret: string | undefined;
  readonly body: unknown;
}

export type ClearExpiredTelegramLinksInput = Readonly<Record<string, never>>;
