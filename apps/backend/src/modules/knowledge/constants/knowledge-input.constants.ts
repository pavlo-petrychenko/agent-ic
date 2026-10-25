import { ErrorReason } from '@agent-ic/contracts';

export enum KnowledgeGraphqlArgument {
  Input = 'input',
}

export enum KnowledgeField {
  Name = 'name',
  Description = 'description',
}

export const KNOWLEDGE_FIELD_PATH_SEPARATOR = '.';

export const KNOWLEDGE_FIELD_REASON: Readonly<Record<string, ErrorReason>> = {
  [KnowledgeField.Name]: ErrorReason.InvalidRequest,
  [KnowledgeField.Description]: ErrorReason.InvalidRequest,
};
