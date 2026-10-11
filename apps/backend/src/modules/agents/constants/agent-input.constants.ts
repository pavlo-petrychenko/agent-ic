import { ErrorReason } from '@agent-ic/contracts';

export enum AgentField {
  Id = 'id',
  AgentId = 'agentId',
  VersionId = 'versionId',
  FromId = 'fromId',
  ToId = 'toId',
  Name = 'name',
  Description = 'description',
  Flow = 'flow',
  Revision = 'revision',
  Note = 'note',
  Mode = 'mode',
  AwayMessage = 'awayMessage',
  NodeId = 'nodeId',
  Variables = 'variables',
}

export enum AgentGraphqlArgument {
  Input = 'input',
  Id = 'id',
  AgentId = 'agentId',
  FromId = 'fromId',
  ToId = 'toId',
  First = 'first',
  After = 'after',
}

export const AGENT_FIELD_PATH_SEPARATOR = '.';

export const AGENT_FIELD_REASON: Readonly<Record<string, ErrorReason>> = {
  [AgentField.Name]: ErrorReason.InvalidAgentName,
  [AgentField.Description]: ErrorReason.InvalidAgentDescription,
};

export const DUPLICATE_AGENT_NAME_SUFFIX = ' (copy)';

export const NUMBERED_AGENT_NAME_SEPARATOR = ' ';
export const FIRST_AGENT_NAME_NUMBER = 2;
export const AGENT_NAMES_LOCK_PREFIX = 'agents.names';
export const AGENT_NAMES_LOCK_SEPARATOR = ':';
