import type { SelectOption } from '@/shared/ui/inputs/Select';

export const API_SECRET_KEY_MOCK = 'demo_secret_9cQ2mT7wZp4LxR8vHn3bK6sY1dE5aF0gQ4';
export const API_ENDPOINT_MOCK = 'POST https://api.agents.example/v1/channels/ch_7Hk2/messages';

export const API_CHANNEL_AGENT_OPTIONS: readonly SelectOption[] = [
  { value: 'agent_salon', label: 'Salon assistant' },
  { value: 'agent_gift', label: 'Gift card FAQ' },
];
