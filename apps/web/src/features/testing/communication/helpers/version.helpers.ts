import { parseFlow } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import type { TestingVersionsQuery } from '@/features/testing/communication/gql/query/testingVersions.generated';
import type { TestingVersion } from '@/features/testing/typedefs/testing.typedefs';
import { AgentVersionStatus, FlowIssueSeverity } from '@/shared/api/generated/schema.generated';

export const toFlow = (flow: unknown): FlowDocument | null => {
  const parsed = parseFlow(flow);
  return parsed.ok ? parsed.flow : null;
};

export const isPublishedVersion = <T extends { number: number | null; status: AgentVersionStatus }>(
  version: T,
): version is T & { number: number } =>
  version.number !== null && version.status !== AgentVersionStatus.Draft;

export const toTestingVersion = ({
  id,
  number,
  status,
  flow,
}: {
  id: string;
  number: number;
  status: AgentVersionStatus;
  flow: unknown;
}): TestingVersion => ({
  id,
  number,
  live: status === AgentVersionStatus.Live,
  flow: toFlow(flow),
});

export const toTestingVersions = (
  versions: TestingVersionsQuery['agentVersions'],
): TestingVersion[] => versions.filter(isPublishedVersion).map(toTestingVersion);

export const hasBlockingIssues = (draft: TestingVersionsQuery['agentDraft']): boolean =>
  draft.issues.some((issue) => issue.severity === FlowIssueSeverity.Error);
