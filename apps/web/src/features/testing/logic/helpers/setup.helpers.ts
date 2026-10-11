import type { Locale } from '@agent-ic/contracts';
import {
  SIMULATOR_CHANNELS,
  SIMULATOR_LANGUAGES,
} from '@/features/testing/constants/simulator.constants';
import type { ChannelKind } from '@/shared/api/generated/schema.generated';

export const isSimulatorChannel = (value: string): value is ChannelKind =>
  SIMULATOR_CHANNELS.some((channel) => channel === value);

export const isSimulatorLanguage = (value: string): value is Locale =>
  SIMULATOR_LANGUAGES.some((language) => language === value);
