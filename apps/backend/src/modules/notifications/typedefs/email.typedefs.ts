import type { Locale } from '@agent-ic/contracts';

export interface EmailMessage {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

export interface RenderedEmail {
  readonly html: string;
  readonly text: string;
}

export interface ConfirmationEmailCopy {
  readonly subject: string;
  readonly greeting: string;
  readonly body: string;
  readonly action: string;
  readonly expiry: string;
  readonly ignore: string;
}

export interface ConfirmationEmailProps {
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
