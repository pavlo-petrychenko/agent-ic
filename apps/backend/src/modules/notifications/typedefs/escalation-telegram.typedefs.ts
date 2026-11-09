import type { ChannelKind, Locale } from '@agent-ic/contracts';

export interface EscalationTelegramProps {
  readonly locale: Locale;
  readonly customerName: string | null;
  readonly agentName: string | null;
  readonly channelKind: ChannelKind | null;
  readonly reason: string | null;
  readonly lastMessage: string | null;
}

export interface EscalationTelegramCopy {
  readonly title: string;
  readonly reasonLabel: string;
  readonly emptyReason: string;
  readonly emptyMessage: string;
  readonly customerFallback: string;
  readonly agentFallback: string;
  readonly channelTelegram: string;
  readonly channelApi: string;
  readonly channelFallback: string;
}
