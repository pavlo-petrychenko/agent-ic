import { ErrorReason } from '@agent-ic/contracts';

export enum AgentField {
  Id = 'id',
  Name = 'name',
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
