import type { Locale } from '@agent-ic/contracts';
import type { ChannelKind } from '@/shared/api/generated/schema.generated';

export interface SimulatorSetupProps {
  channelKind: ChannelKind;
  language: Locale;
  onChannelKindChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
}
