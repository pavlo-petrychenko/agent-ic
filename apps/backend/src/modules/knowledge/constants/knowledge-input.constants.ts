import { ErrorReason } from '@agent-ic/contracts';

export enum KnowledgeGraphqlArgument {
  Input = 'input',
}

export enum KnowledgeField {
  Id = 'id',
  Name = 'name',
  Description = 'description',
}

export const KNOWLEDGE_FIELD_PATH_SEPARATOR = '.';

export const KNOWLEDGE_FIELD_REASON: Readonly<Record<string, ErrorReason>> = {
  [KnowledgeField.Id]: ErrorReason.InvalidId,
  [KnowledgeField.Name]: ErrorReason.InvalidRequest,
  [KnowledgeField.Description]: ErrorReason.InvalidRequest,
};
