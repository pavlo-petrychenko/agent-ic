import {
  KNOWLEDGE_SCHEMA,
  KnowledgeConnectionProvider,
  KnowledgeConnectionStatus,
  KnowledgeDocumentStatus,
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
  KnowledgeSummarySource,
  KnowledgeSyncInterval,
  KnowledgeSyncMode,
  KnowledgeSyncStatus,
  KnowledgeSyncTrigger,
} from '@/modules/knowledge/constants/knowledge.constants';
import { moduleSchema } from '@/platform/database/helpers/tenant-table.helpers';

export const knowledgeSchema = moduleSchema(KNOWLEDGE_SCHEMA);

export const knowledgeSourceKindEnum = knowledgeSchema.enum('knowledge_source_kind', [
  KnowledgeSourceKind.Upload,
  KnowledgeSourceKind.GoogleDocs,
]);

export const knowledgeSourceStatusEnum = knowledgeSchema.enum('knowledge_source_status', [
  KnowledgeSourceStatus.Pending,
  KnowledgeSourceStatus.Indexing,
  KnowledgeSourceStatus.Ready,
  KnowledgeSourceStatus.Error,
]);

export const knowledgeSyncModeEnum = knowledgeSchema.enum('knowledge_sync_mode', [
  KnowledgeSyncMode.Manual,
  KnowledgeSyncMode.Once,
  KnowledgeSyncMode.Scheduled,
]);

export const knowledgeSyncIntervalEnum = knowledgeSchema.enum('knowledge_sync_interval', [
  KnowledgeSyncInterval.Hourly,
  KnowledgeSyncInterval.Daily,
  KnowledgeSyncInterval.Weekly,
]);

export const knowledgeSyncTriggerEnum = knowledgeSchema.enum('knowledge_sync_trigger', [
  KnowledgeSyncTrigger.Initial,
  KnowledgeSyncTrigger.Manual,
  KnowledgeSyncTrigger.Scheduled,
]);

export const knowledgeSyncStatusEnum = knowledgeSchema.enum('knowledge_sync_status', [
  KnowledgeSyncStatus.Queued,
  KnowledgeSyncStatus.Running,
  KnowledgeSyncStatus.Succeeded,
  KnowledgeSyncStatus.Partial,
  KnowledgeSyncStatus.Failed,
]);

export const knowledgeDocumentStatusEnum = knowledgeSchema.enum('knowledge_document_status', [
  KnowledgeDocumentStatus.Pending,
  KnowledgeDocumentStatus.Indexing,
  KnowledgeDocumentStatus.Indexed,
  KnowledgeDocumentStatus.Error,
  KnowledgeDocumentStatus.Removed,
]);

export const knowledgeSummarySourceEnum = knowledgeSchema.enum('knowledge_summary_source', [
  KnowledgeSummarySource.Auto,
  KnowledgeSummarySource.User,
]);

export const knowledgeConnectionProviderEnum = knowledgeSchema.enum(
  'knowledge_connection_provider',
  [KnowledgeConnectionProvider.GoogleDocs],
);

export const knowledgeConnectionStatusEnum = knowledgeSchema.enum('knowledge_connection_status', [
  KnowledgeConnectionStatus.Active,
  KnowledgeConnectionStatus.Revoked,
  KnowledgeConnectionStatus.Error,
]);
