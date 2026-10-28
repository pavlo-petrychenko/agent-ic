import { ErrorReason } from '@agent-ic/contracts';

export enum KnowledgeGraphqlArgument {
  Input = 'input',
}

export enum KnowledgeField {
  Id = 'id',
  Name = 'name',
  Description = 'description',
  KnowledgeBaseId = 'knowledgeBaseId',
  DocumentId = 'documentId',
  SourceId = 'sourceId',
  FileName = 'fileName',
  MimeType = 'mimeType',
  SizeBytes = 'sizeBytes',
}

export const KNOWLEDGE_FIELD_PATH_SEPARATOR = '.';

export const KNOWLEDGE_FIELD_REASON: Readonly<Record<string, ErrorReason>> = {
  [KnowledgeField.Id]: ErrorReason.InvalidId,
  [KnowledgeField.Name]: ErrorReason.InvalidRequest,
  [KnowledgeField.Description]: ErrorReason.InvalidRequest,
  [KnowledgeField.KnowledgeBaseId]: ErrorReason.InvalidId,
  [KnowledgeField.DocumentId]: ErrorReason.InvalidId,
  [KnowledgeField.SourceId]: ErrorReason.InvalidId,
  [KnowledgeField.FileName]: ErrorReason.InvalidRequest,
  [KnowledgeField.MimeType]: ErrorReason.InvalidRequest,
  [KnowledgeField.SizeBytes]: ErrorReason.InvalidRequest,
};
