import type { KnowledgeSourceDetailQuery } from '@/features/knowledge/communication/gql/query/knowledgeSourceDetail.generated';
import type { KnowledgeSourcesQuery } from '@/features/knowledge/communication/gql/query/knowledgeSources.generated';
import { KnowledgeDocumentStatus } from '@/features/knowledge/constants/knowledgeDocument.constants';
import {
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
  KnowledgeSyncInterval,
} from '@/features/knowledge/constants/knowledgeSource.constants';
import type {
  KnowledgeSource,
  KnowledgeSourceDetail,
  KnowledgeSourceDocument,
} from '@/features/knowledge/typedefs/knowledgeSource.typedefs';
import {
  KnowledgeDocumentStatus as GraphqlKnowledgeDocumentStatus,
  KnowledgeSourceKind as GraphqlKnowledgeSourceKind,
  KnowledgeSourceStatus as GraphqlKnowledgeSourceStatus,
  KnowledgeSyncInterval as GraphqlKnowledgeSyncInterval,
} from '@/shared/api/generated/schema.generated';
import type { KnowledgeSource as GraphqlKnowledgeSource } from '@/shared/api/generated/schema.generated';

const KIND: Readonly<Record<GraphqlKnowledgeSourceKind, KnowledgeSourceKind>> = {
  [GraphqlKnowledgeSourceKind.Upload]: KnowledgeSourceKind.Upload,
  [GraphqlKnowledgeSourceKind.GoogleDocs]: KnowledgeSourceKind.GoogleDocs,
};

const STATUS: Readonly<Record<GraphqlKnowledgeSourceStatus, KnowledgeSourceStatus>> = {
  [GraphqlKnowledgeSourceStatus.Pending]: KnowledgeSourceStatus.Pending,
  [GraphqlKnowledgeSourceStatus.Indexing]: KnowledgeSourceStatus.Indexing,
  [GraphqlKnowledgeSourceStatus.Ready]: KnowledgeSourceStatus.Ready,
  [GraphqlKnowledgeSourceStatus.Error]: KnowledgeSourceStatus.Error,
};

const INTERVAL: Readonly<Record<GraphqlKnowledgeSyncInterval, KnowledgeSyncInterval>> = {
  [GraphqlKnowledgeSyncInterval.Hourly]: KnowledgeSyncInterval.Hourly,
  [GraphqlKnowledgeSyncInterval.Daily]: KnowledgeSyncInterval.Daily,
  [GraphqlKnowledgeSyncInterval.Weekly]: KnowledgeSyncInterval.Weekly,
};

const DOCUMENT_STATUS: Readonly<Record<GraphqlKnowledgeDocumentStatus, KnowledgeDocumentStatus>> = {
  [GraphqlKnowledgeDocumentStatus.Pending]: KnowledgeDocumentStatus.Pending,
  [GraphqlKnowledgeDocumentStatus.Indexing]: KnowledgeDocumentStatus.Indexing,
  [GraphqlKnowledgeDocumentStatus.Indexed]: KnowledgeDocumentStatus.Indexed,
  [GraphqlKnowledgeDocumentStatus.Error]: KnowledgeDocumentStatus.Error,
  [GraphqlKnowledgeDocumentStatus.Removed]: KnowledgeDocumentStatus.Removed,
};

export const toKnowledgeSource = (source: GraphqlKnowledgeSource): KnowledgeSource => ({
  ...source,
  kind: KIND[source.kind],
  status: STATUS[source.status],
  syncInterval: source.syncInterval === null ? null : INTERVAL[source.syncInterval],
});

export const toKnowledgeSources = (data: KnowledgeSourcesQuery): KnowledgeSource[] =>
  data.knowledgeSources.map(toKnowledgeSource);

const toKnowledgeSourceDocument = (
  document: KnowledgeSourceDetailQuery['knowledgeSource']['documents'][number],
): KnowledgeSourceDocument => ({
  ...document,
  status: DOCUMENT_STATUS[document.status],
});

export const toKnowledgeSourceDetail = (
  data: KnowledgeSourceDetailQuery,
): KnowledgeSourceDetail => ({
  source: toKnowledgeSource(data.knowledgeSource.source),
  connection: data.knowledgeSource.connection,
  documents: data.knowledgeSource.documents.map(toKnowledgeSourceDocument),
});
