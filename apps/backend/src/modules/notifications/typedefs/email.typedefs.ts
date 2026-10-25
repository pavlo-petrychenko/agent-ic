import type { Locale } from '@agent-ic/contracts';
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

export interface ResendEmailRequest {
  readonly from: string;
  readonly to: readonly string[];
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}
