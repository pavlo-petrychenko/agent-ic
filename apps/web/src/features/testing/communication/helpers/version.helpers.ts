import type { TestingVersionsQuery } from '@/features/testing/communication/gql/query/testingVersions.generated';
import type { TestingVersion } from '@/features/testing/typedefs/testing.typedefs';
import { AgentVersionStatus, FlowIssueSeverity } from '@/shared/api/generated/schema.generated';

export const toTestingVersions = (
  versions: TestingVersionsQuery['agentVersions'],
): TestingVersion[] =>
  versions.flatMap(({ id, number, status }) =>
    number === null || status === AgentVersionStatus.Draft
      ? []
      : [{ id, number, live: status === AgentVersionStatus.Live }],
  );

export const hasBlockingIssues = (draft: TestingVersionsQuery['agentDraft']): boolean =>
  draft.issues.some((issue) => issue.severity === FlowIssueSeverity.Error);
