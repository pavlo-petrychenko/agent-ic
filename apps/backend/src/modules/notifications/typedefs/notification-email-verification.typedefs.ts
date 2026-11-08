import type { Locale } from '@agent-ic/contracts';

export interface NotificationEmailVerificationProps {
  readonly locale: Locale;
  readonly name: string;
  readonly workspaceName: string;
  readonly email: string;
  readonly link: string;
}
