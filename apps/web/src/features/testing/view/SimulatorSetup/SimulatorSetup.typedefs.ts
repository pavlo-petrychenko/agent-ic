import type { Locale } from '@agent-ic/contracts';
import type { ChannelConversationKind } from '@/shared/api/generated/schema.generated';

export interface SimulatorSetupProps {
  channelKind: ChannelConversationKind;
  language: Locale;
  onChannelKindChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
}
