import type {
  ApiChannelMock,
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

export const API_CHANNEL_MOCKS: readonly ApiChannelMock[] = [
  {
    id: 'website',
    name: 'Website',
    agentName: 'Gift card FAQ',
    sendsEvents: false,
  },
  {
    id: 'salon_crm',
    name: 'Salon CRM',
    agentName: 'Salon assistant',
    sendsEvents: true,
  },
];
