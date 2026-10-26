import {
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
  KnowledgeSyncInterval,
} from '@/modules/knowledge/constants/knowledge.constants';
import type { KnowledgeSourceView } from '@/modules/knowledge/typedefs/source.typedefs';
import {
  KnowledgeSourceKind as GraphqlKnowledgeSourceKind,
  KnowledgeSourceStatus as GraphqlKnowledgeSourceStatus,
  KnowledgeSyncInterval as GraphqlKnowledgeSyncInterval,
} from '@/platform/graphql-server/generated/schema.generated';
import type { KnowledgeSource as GraphqlKnowledgeSource } from '@/platform/graphql-server/generated/schema.generated';

const KIND: Readonly<Record<KnowledgeSourceKind, GraphqlKnowledgeSourceKind>> = {
  [KnowledgeSourceKind.Upload]: GraphqlKnowledgeSourceKind.Upload,
  [KnowledgeSourceKind.GoogleDocs]: GraphqlKnowledgeSourceKind.GoogleDocs,
};

const STATUS: Readonly<Record<KnowledgeSourceStatus, GraphqlKnowledgeSourceStatus>> = {
  [KnowledgeSourceStatus.Pending]: GraphqlKnowledgeSourceStatus.Pending,
  [KnowledgeSourceStatus.Indexing]: GraphqlKnowledgeSourceStatus.Indexing,
  [KnowledgeSourceStatus.Ready]: GraphqlKnowledgeSourceStatus.Ready,
  [KnowledgeSourceStatus.Error]: GraphqlKnowledgeSourceStatus.Error,
};

const INTERVAL: Readonly<Record<KnowledgeSyncInterval, GraphqlKnowledgeSyncInterval>> = {
  [KnowledgeSyncInterval.Hourly]: GraphqlKnowledgeSyncInterval.Hourly,
  [KnowledgeSyncInterval.Daily]: GraphqlKnowledgeSyncInterval.Daily,
  [KnowledgeSyncInterval.Weekly]: GraphqlKnowledgeSyncInterval.Weekly,
};

export const toGraphqlKnowledgeSource = (source: KnowledgeSourceView): GraphqlKnowledgeSource => ({
  id: source.id,
  knowledgeBaseId: source.knowledgeBaseId,
  kind: KIND[source.kind],
  title: source.title,
  status: STATUS[source.status],
  syncInterval: source.syncInterval === null ? null : INTERVAL[source.syncInterval],
  nextSyncAt: source.nextSyncAt?.toISOString() ?? null,
  lastSyncAt: source.lastSyncAt?.toISOString() ?? null,
  lastErrorCode: source.lastErrorCode,
  lastErrorMessage: source.lastErrorMessage,
  documentCount: source.documentCount,
  chunkCount: source.chunkCount,
  createdAt: source.createdAt.toISOString(),
  updatedAt: source.updatedAt.toISOString(),
});

export const toGraphqlKnowledgeSources = (
  sources: readonly KnowledgeSourceView[],
): GraphqlKnowledgeSource[] => sources.map(toGraphqlKnowledgeSource);
