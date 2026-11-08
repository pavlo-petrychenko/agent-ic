import type { ChannelKind, Locale } from '@agent-ic/contracts';

export interface EscalationTelegramProps {
  readonly locale: Locale;
  readonly customerName: string | null;
  readonly agentName: string | null;
  readonly channelKind: ChannelKind | null;
  readonly reason: string | null;
  readonly lastMessage: string | null;
  readonly waitingMinutes: number;
}

export interface EscalationTelegramCopy {
  readonly title: string;
  readonly waitingLine: string;
  readonly reasonLabel: string;
  readonly emptyReason: string;
  readonly emptyMessage: string;
  readonly openInInbox: string;
  readonly takeOver: string;
  readonly customerFallback: string;
  readonly agentFallback: string;
  readonly channelTelegram: string;
  readonly channelApi: string;
  readonly channelFallback: string;
}
