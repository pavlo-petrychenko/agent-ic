import { ChannelKind } from '@agent-ic/contracts';
import { ChannelType } from '@agent-ic/flow';

export const FIRST_INACTIVITY_ATTEMPT = 1;

export const NO_INACTIVITY_ATTEMPTS = 0;

export const INACTIVITY_SWEEP_INTERVAL_SECONDS = 60;

export const INACTIVITY_SWEEP_LIMIT = 500;

export const INACTIVITY_SWEEP_WORKSPACE_LIMIT = 50;

export const INACTIVITY_LEASE_SECONDS = 300;

export enum InactivityFireOutcome {
  Started = 'started',
  Busy = 'busy',
  Stale = 'stale',
  NotActive = 'not_active',
  CustomerWrote = 'customer_wrote',
  AgentUnavailable = 'agent_unavailable',
  TriggerRemoved = 'trigger_removed',
  AttemptsUsed = 'attempts_used',
  Escalated = 'escalated',
  ChannelExcluded = 'channel_excluded',
  Undeliverable = 'undeliverable',
  OverLimit = 'over_limit',
}

export const CHANNEL_TYPE_OF_KIND: Readonly<Record<ChannelKind, ChannelType | null>> = {
  [ChannelKind.Simulated]: null,
  [ChannelKind.Telegram]: ChannelType.Telegram,
  [ChannelKind.Api]: ChannelType.Api,
};
