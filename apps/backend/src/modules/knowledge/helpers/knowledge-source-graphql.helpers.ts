import {
  KnowledgeDocumentStatus,
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
  KnowledgeSyncInterval,
} from '@/modules/knowledge/constants/knowledge.constants';
import { toGraphqlGoogleConnection } from '@/modules/knowledge/helpers/knowledge-connection-graphql.helpers';
import type {
  KnowledgeSourceDetailView,
  KnowledgeSourceDocumentView,
  KnowledgeSourceView,
} from '@/modules/knowledge/typedefs/source.typedefs';
import {
  KnowledgeDocumentStatus as GraphqlKnowledgeDocumentStatus,
  KnowledgeSourceKind as GraphqlKnowledgeSourceKind,
  KnowledgeSourceStatus as GraphqlKnowledgeSourceStatus,
  KnowledgeSyncInterval as GraphqlKnowledgeSyncInterval,
} from '@/platform/graphql-server/generated/schema.generated';
import type {
  KnowledgeSource as GraphqlKnowledgeSource,
  KnowledgeSourceDetail as GraphqlKnowledgeSourceDetail,
  KnowledgeSourceDocument as GraphqlKnowledgeSourceDocument,
} from '@/platform/graphql-server/generated/schema.generated';

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

const DOCUMENT_STATUS: Readonly<Record<KnowledgeDocumentStatus, GraphqlKnowledgeDocumentStatus>> = {
  [KnowledgeDocumentStatus.Pending]: GraphqlKnowledgeDocumentStatus.Pending,
  [KnowledgeDocumentStatus.Indexing]: GraphqlKnowledgeDocumentStatus.Indexing,
  [KnowledgeDocumentStatus.Indexed]: GraphqlKnowledgeDocumentStatus.Indexed,
  [KnowledgeDocumentStatus.Error]: GraphqlKnowledgeDocumentStatus.Error,
  [KnowledgeDocumentStatus.Removed]: GraphqlKnowledgeDocumentStatus.Removed,
};

export const toGraphqlKnowledgeSource = (source: KnowledgeSourceView): GraphqlKnowledgeSource => ({
  id: source.id,
  knowledgeBaseId: source.knowledgeBaseId,
  connectionId: source.connectionId,
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

export const toGraphqlKnowledgeSourceDocument = (
  document: KnowledgeSourceDocumentView,
): GraphqlKnowledgeSourceDocument => ({
  id: document.id,
  title: document.title,
  status: DOCUMENT_STATUS[document.status],
  summary: document.summary,
  errorCode: document.errorCode,
  errorMessage: document.errorMessage,
  tokenCount: document.tokenCount,
  chunkCount: document.chunkCount,
  createdAt: document.createdAt.toISOString(),
  updatedAt: document.updatedAt.toISOString(),
});

export const toGraphqlKnowledgeSourceDetail = (
  detail: KnowledgeSourceDetailView,
): GraphqlKnowledgeSourceDetail => ({
  source: toGraphqlKnowledgeSource(detail.source),
  connection: detail.connection === null ? null : toGraphqlGoogleConnection(detail.connection),
  documents: detail.documents.map(toGraphqlKnowledgeSourceDocument),
});
