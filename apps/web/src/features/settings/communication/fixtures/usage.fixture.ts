import type { MockLink } from '@apollo/client/testing';
import { UsageStatusDocument } from '@/features/settings/communication/gql/query/usageStatus.generated';
import { WorkspaceUsageDocument } from '@/features/settings/communication/gql/query/workspaceUsage.generated';

export const USAGE_PERIOD_START = '2026-10-01T00:00:00.000Z';
export const USAGE_PERIOD_END = '2026-11-01T00:00:00.000Z';

interface MeterFixture {
  readonly used: number;
  readonly limit: number;
}

interface WorkspaceUsageFixture {
  readonly credits: MeterFixture;
  readonly conversations: MeterFixture;
  readonly chunks: MeterFixture;
}

const meter = ({ used, limit }: MeterFixture) => ({ __typename: 'UsageMeter', used, limit });

export const DEFAULT_USAGE: WorkspaceUsageFixture = {
  credits: { used: 7200, limit: 10000 },
  conversations: { used: 4190, limit: 10000 },
  chunks: { used: 107, limit: 5000 },
};

export const buildWorkspaceUsageMock = (
  usage: WorkspaceUsageFixture = DEFAULT_USAGE,
): MockLink.MockedResponse => ({
  request: { query: WorkspaceUsageDocument },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: {
    data: {
      workspaceUsage: {
        __typename: 'WorkspaceUsage',
        periodStart: USAGE_PERIOD_START,
        periodEnd: USAGE_PERIOD_END,
        credits: meter(usage.credits),
        conversations: meter(usage.conversations),
        chunks: meter(usage.chunks),
      },
    },
  },
});

export const buildWorkspaceUsageErrorMock = (): MockLink.MockedResponse => ({
  request: { query: WorkspaceUsageDocument },
  error: new Error('usage failed'),
});

export const buildUsageStatusMock = (
  limitReached: boolean,
  reachedAt: string | null = null,
): MockLink.MockedResponse => ({
  request: { query: UsageStatusDocument },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: {
    data: {
      usageStatus: {
        __typename: 'UsageStatus',
        limitReached,
        reachedAt,
        periodEnd: USAGE_PERIOD_END,
      },
    },
  },
});
