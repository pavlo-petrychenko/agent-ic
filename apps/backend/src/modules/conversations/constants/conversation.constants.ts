export { ChannelKind } from '@agent-ic/contracts';

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

export enum WaitingReason {
  AgentPaused = 'agent_paused',
  Escalated = 'escalated',
}

export const CONVERSATIONS_SCHEMA = 'conversations';
