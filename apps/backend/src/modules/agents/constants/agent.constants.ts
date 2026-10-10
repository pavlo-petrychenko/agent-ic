export const AGENTS_SCHEMA = 'agents';

export enum PauseMode {
  Inbox = 'inbox',
  AwayMessage = 'away_message',
}

export enum AgentVersionKind {
  Draft = 'draft',
  Published = 'published',
  Snapshot = 'snapshot',
}

export enum AgentStatus {
  Draft = 'draft',
  Live = 'live',
  Paused = 'paused',
}

export const INITIAL_TRIGGER_KEY = 'trigger';
export const INITIAL_TRIGGER_LABEL = 'Customer message';
export const INITIAL_TRIGGER_POSITION = { x: 0, y: 0 } as const;
