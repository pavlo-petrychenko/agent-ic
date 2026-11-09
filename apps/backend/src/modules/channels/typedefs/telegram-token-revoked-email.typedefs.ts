import type { Locale } from '@agent-ic/contracts';

export interface TelegramTokenRevokedEmailRecipient {
  readonly email: string;
  readonly name: string;
  readonly locale: Locale;
}

export interface TelegramTokenRevokedEmailProps {
  readonly recipient: TelegramTokenRevokedEmailRecipient;
  readonly workspaceName: string;
  readonly channelName: string | null;
  readonly link: string;
}

export interface TelegramTokenRevokedEmailAudience {
  readonly workspaceName: string;
  readonly channelName: string | null;
  readonly recipients: readonly TelegramTokenRevokedEmailRecipient[];
}
