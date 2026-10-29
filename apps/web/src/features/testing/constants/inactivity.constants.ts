export enum InactivityAction {
  AutoClose = 'autoClose',
  Trigger = 'trigger',
}

export enum InactivityRefusal {
  Escalated = 'escalated',
  ChannelExcluded = 'channel_excluded',
  OverLimit = 'over_limit',
  AgentUnavailable = 'agent_unavailable',
  Undeliverable = 'undeliverable',
  Stale = 'stale',
}

export const REFUSAL_OUTCOME_FIELD = 'outcome';
