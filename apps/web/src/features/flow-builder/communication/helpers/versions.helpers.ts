import type { BuilderVersionsQuery } from '@/features/flow-builder/communication/gql/query/builderVersions.generated';
import type { BuilderVersion } from '@/features/flow-builder/typedefs/versions.typedefs';
import { AgentVersionStatus } from '@/shared/api/generated/schema.generated';

type ApiVersion = BuilderVersionsQuery['agentVersions'][number];

const isPublished = (version: ApiVersion): version is ApiVersion & { number: number } =>
  version.number !== null && version.status !== AgentVersionStatus.Draft;

export const toBuilderVersions = ({ agentVersions }: BuilderVersionsQuery): BuilderVersion[] =>
  agentVersions
    .filter(isPublished)
    .map((version) => ({
      id: version.id,
      number: version.number,
      live: version.status === AgentVersionStatus.Live,
      note: version.note,
      authorName: version.author?.name ?? null,
      publishedAt: version.publishedAt,
    }))
    .sort((first, second) => second.number - first.number);
