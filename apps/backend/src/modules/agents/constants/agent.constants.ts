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
