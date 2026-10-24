import type { ApiChannelMock } from '@/features/channels/typedefs/apiChannel.typedefs';
import { ApiReplyMode } from '@/features/channels/typedefs/apiChannel.typedefs';
import type {
  TelegramBotMock,
  TelegramBotStats,
} from '@/features/channels/typedefs/telegramBot.typedefs';
import { TelegramBotStatus } from '@/features/channels/typedefs/telegramBot.typedefs';
import type { SelectOption } from '@/shared/ui/inputs/Select';

export const EMPTY_TELEGRAM_STATS: TelegramBotStats = {
  chats: '0',
  messages: '0',
  errors: '0',
};

export const TELEGRAM_BOT_AGENT_OPTIONS: readonly SelectOption[] = [
  { value: 'agent_salon', label: 'Salon assistant' },
  { value: 'agent_reviews', label: 'Review collector' },
];

export const CONNECTED_TELEGRAM_BOT: TelegramBotMock = {
  id: 'demo_salon_bot',
  username: '@demo_salon_bot',
  agentId: 'agent_salon',
  agentName: 'Salon assistant',
  status: TelegramBotStatus.Connected,
  tokenMasked: '7091•••••:AAH••••••••••••••••••••',
  lastUpdateTime: '14:21',
  lastUpdateAuthor: 'Kateryna D.',
  lastUpdateDate: 'Today',
  botName: 'Demo salon',
  revokedTime: null,
  publishedVersion: 3,
  agentIsDraft: false,
  typingIndicator: true,
  stats: { chats: '1,470', messages: '9,812', errors: '0' },
};

export const REVOKED_TELEGRAM_BOT: TelegramBotMock = {
  id: 'demo_reviews_bot',
  username: '@demo_reviews_bot',
  agentId: 'agent_reviews',
  agentName: 'Review collector',
  status: TelegramBotStatus.Revoked,
  tokenMasked: '6620•••••:AAF••••••••••••••••••••',
  lastUpdateTime: '14:01',
  lastUpdateAuthor: 'Iryna V.',
  lastUpdateDate: 'Sep 30',
  botName: null,
  revokedTime: '14:02',
  publishedVersion: null,
  agentIsDraft: true,
  typingIndicator: false,
  stats: null,
};

export const TELEGRAM_BOTS: readonly TelegramBotMock[] = [
  CONNECTED_TELEGRAM_BOT,
  REVOKED_TELEGRAM_BOT,
];

export const DEFAULT_TELEGRAM_BOT = CONNECTED_TELEGRAM_BOT;

export const WEBSITE_API_CHANNEL: ApiChannelMock = {
  id: 'website',
  name: 'Website',
  agentId: 'agent_gift',
  agentName: 'Gift card FAQ',
  sendsEvents: false,
  endpoint: 'POST https://api.agents.example/v1/channels/ch_7Hk2/messages',
  secretMasked: 'demo_secret_••••••••••••••••Q4',
  replyMode: ApiReplyMode.Response,
  webhook: 'https://demo-salon.example/hooks/agent',
  exampleRequest: `curl -X POST https://api.agents.example/v1/channels/ch_7Hk2/messages \\
  -H "Authorization: Bearer $KEY" \\
  -d '{ "user_id": "site-8812",
        "text": "Can I use a gift card online?" }'`,
  exampleResponse: `{ "conversation_id": "cv_31a",
  "messages": [
    "Yes — enter the code at checkout."
  ],
  "status": "answered" }`,
};

export const SALON_CRM_API_CHANNEL: ApiChannelMock = {
  id: 'salon_crm',
  name: 'Salon CRM',
  agentId: 'agent_salon',
  agentName: 'Salon assistant',
  sendsEvents: true,
  endpoint: 'POST https://api.agents.example/v1/channels/ch_9Pq4/messages',
  secretMasked: 'demo_secret_••••••••••••••••R7',
  replyMode: ApiReplyMode.Webhook,
  webhook: 'https://demo-salon.example/hooks/crm',
  exampleRequest: `curl -X POST https://api.agents.example/v1/channels/ch_9Pq4/messages \\
  -H "Authorization: Bearer $KEY" \\
  -d '{ "user_id": "crm-4410",
        "text": "Book a cut for Friday" }'`,
  exampleResponse: `{ "conversation_id": "cv_44b",
  "messages": [],
  "status": "escalated" }`,
};

export const API_CHANNEL_MOCKS: readonly ApiChannelMock[] = [
  WEBSITE_API_CHANNEL,
  SALON_CRM_API_CHANNEL,
];

export const DEFAULT_API_CHANNEL = WEBSITE_API_CHANNEL;
