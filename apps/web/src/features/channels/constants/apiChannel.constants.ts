import type { SelectOption } from '@/shared/ui/inputs/Select';

export const API_SECRET_KEY_MOCK = 'sk_live_abcdefghijklmnopQ4';
export const API_ENDPOINT_MOCK = 'POST https://api.agents.example/v1/channels/ch_7Hk2/messages';

export const API_CHANNEL_AGENT_OPTIONS: readonly SelectOption[] = [
  { value: 'agent_salon', label: 'Salon assistant' },
  { value: 'agent_gift', label: 'Gift card FAQ' },
];
