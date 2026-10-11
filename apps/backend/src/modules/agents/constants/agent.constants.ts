import { FLOW_SCHEMA_VERSION } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';

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

export enum AgentVersionStatus {
  Draft = 'draft',
  Live = 'live',
  Archived = 'archived',
}

export enum AgentVersionAlias {
  Draft = 'draft_version',
  Live = 'live_version',
  Base = 'base_version',
  Published = 'published_versions',
}

export enum AgentVersionAggregate {
  Count = 'version_count',
  LastNumber = 'last_number',
}

export const NO_PUBLISHED_VERSIONS = 0;

export const DRAFT_INITIAL_REVISION = 0;

export enum AgentStatus {
  Draft = 'draft',
  Live = 'live',
  Paused = 'paused',
}

export const INITIAL_TRIGGER_KEY = 'trigger';
export const INITIAL_TRIGGER_LABEL = 'Customer message';
export const INITIAL_TRIGGER_POSITION = { x: 0, y: 0 } as const;

export const EMPTY_FLOW: FlowDocument = {
  schemaVersion: FLOW_SCHEMA_VERSION,
  nodes: [],
  edges: [],
};

export enum SimulatorCheckStatus {
  Tested = 'tested',
  NotTested = 'not_tested',
}
