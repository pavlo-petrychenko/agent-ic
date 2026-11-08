import type { ChannelKind, Locale } from '@agent-ic/contracts';
import type { EmailTemplate } from '@/modules/notifications/constants/notification-metrics.constants';

export interface EmailMessage {
  readonly template: EmailTemplate;
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

export interface RenderedEmail {
  readonly html: string;
  readonly text: string;
}

export interface ActionEmailCopy {
  readonly subject: string;
  readonly greeting: string;
  readonly body: string;
  readonly action: string;
  readonly expiry: string;
  readonly ignore: string;
}

export interface ActionEmailProps {
  readonly locale: Locale;
  readonly name: string;
  readonly link: string;
}

export interface EscalationEmailProps {
  readonly locale: Locale;
  readonly customerName: string | null;
  readonly agentName: string | null;
  readonly recipientEmail: string;
  readonly channelKind: ChannelKind | null;
  readonly reason: string | null;
  readonly lastMessage: string | null;
  readonly time: string;
  readonly workspaceName: string | null;
  readonly link: string;
  readonly waitingMinutes: number;
}

export interface EscalationEmailCopy {
  readonly title: string;
  readonly subject: string;
  readonly body: string;
  readonly reasonLabel: string;
  readonly emptyReason: string;
  readonly emptyMessage: string;
  readonly action: string;
  readonly footer: string;
  readonly metaTo: string;
  readonly customerFallback: string;
  readonly agentFallback: string;
  readonly workspaceFallback: string;
  readonly channelTelegram: string;
  readonly channelApi: string;
  readonly channelFallback: string;
}

export interface ResendEmailRequest {
  readonly from: string;
  readonly to: readonly string[];
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}
