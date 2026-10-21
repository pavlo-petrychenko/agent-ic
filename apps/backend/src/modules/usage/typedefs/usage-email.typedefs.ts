import type { Locale } from '@agent-ic/contracts';
import type { UsageThreshold } from '@/modules/usage/constants/usage.constants';

export interface UsageEmailRecipient {
  readonly email: string;
  readonly name: string;
  readonly locale: Locale;
  readonly workspaceName: string;
}

export interface UsageThresholdEmailProps {
  readonly recipient: UsageEmailRecipient;
  readonly threshold: UsageThreshold;
  readonly link: string;
}
