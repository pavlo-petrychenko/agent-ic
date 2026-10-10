import { ErrorReason } from '@agent-ic/contracts';

export enum AgentField {
  Id = 'id',
  Name = 'name',
  Flow = 'flow',
  Note = 'note',
}

export enum AgentGraphqlArgument {
  Input = 'input',
  Id = 'id',
  First = 'first',
  After = 'after',
}

export const AGENT_FIELD_PATH_SEPARATOR = '.';

export const AGENT_FIELD_REASON: Readonly<Record<string, ErrorReason>> = {
  [AgentField.Name]: ErrorReason.InvalidAgentName,
};

export const AGENT_VERSION_NOTE_MAX_LENGTH = 500;
