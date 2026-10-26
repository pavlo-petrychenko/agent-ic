import type { KnowledgeSourcesQuery } from '@/features/knowledge/communication/gql/query/knowledgeSources.generated';
import {
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
  KnowledgeSyncInterval,
} from '@/features/knowledge/constants/knowledgeSource.constants';
import type { KnowledgeSource } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';
import {
  KnowledgeSourceKind as GraphqlKnowledgeSourceKind,
  KnowledgeSourceStatus as GraphqlKnowledgeSourceStatus,
  KnowledgeSyncInterval as GraphqlKnowledgeSyncInterval,
} from '@/shared/api/generated/schema.generated';

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

export const toKnowledgeSource = (
  source: KnowledgeSourcesQuery['knowledgeSources'][number],
): KnowledgeSource => ({
  ...source,
  kind: KIND[source.kind],
  status: STATUS[source.status],
  syncInterval: source.syncInterval === null ? null : INTERVAL[source.syncInterval],
});

export const toKnowledgeSources = (data: KnowledgeSourcesQuery): KnowledgeSource[] =>
  data.knowledgeSources.map(toKnowledgeSource);
