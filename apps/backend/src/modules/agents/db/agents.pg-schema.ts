import {
  AGENTS_SCHEMA,
  AgentVersionKind,
  PauseMode,
} from '@/modules/agents/constants/agent.constants';
import { moduleSchema } from '@/platform/database/helpers/tenant-table.helpers';

export const agentsSchema = moduleSchema(AGENTS_SCHEMA);

export const pauseModeEnum = agentsSchema.enum('pause_mode', [
  PauseMode.Inbox,
  PauseMode.AwayMessage,
]);

export const agentVersionKindEnum = agentsSchema.enum('agent_version_kind', [
  AgentVersionKind.Draft,
  AgentVersionKind.Published,
  AgentVersionKind.Snapshot,
]);
