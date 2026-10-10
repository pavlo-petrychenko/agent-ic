import { ErrorReason } from '@agent-ic/contracts';

export enum AgentField {
  Id = 'id',
  Name = 'name',
}

export const AGENT_FIELD_PATH_SEPARATOR = '.';

export const AGENT_FIELD_REASON: Readonly<Record<string, ErrorReason>> = {
  [AgentField.Name]: ErrorReason.InvalidAgentName,
};
