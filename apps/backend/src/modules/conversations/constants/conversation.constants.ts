export enum ConversationMode {
  Live = 'live',
  Simulation = 'simulation',
}

export enum ConversationState {
  AgentActive = 'agent_active',
  Waiting = 'waiting',
  Handled = 'handled',
  Closed = 'closed',
}

export enum ChannelKind {
  Simulated = 'simulated',
  Telegram = 'telegram',
  Api = 'api',
}

export enum WaitingReason {
  AgentPaused = 'agent_paused',
  Escalated = 'escalated',
}

export const CONVERSATIONS_SCHEMA = 'conversations';

export const END_USER_LOCK_KEY_SEPARATOR = ':';

export const END_USER_LOCK_HASH_SEED = 0;
