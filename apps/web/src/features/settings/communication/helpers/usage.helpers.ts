import type { UsageStatusQuery } from '@/features/settings/communication/gql/query/usageStatus.generated';
import type { WorkspaceUsageQuery } from '@/features/settings/communication/gql/query/workspaceUsage.generated';
import { UsageMetricKey } from '@/features/settings/constants/usage.constants';
import type {
  UsageStatusView,
  WorkspaceUsageView,
} from '@/features/settings/typedefs/usage.typedefs';

export const toWorkspaceUsage = (
  data: WorkspaceUsageQuery | undefined,
): WorkspaceUsageView | null => {
  if (data === undefined) {
    return null;
  }
  const { workspaceUsage: usage } = data;
  return {
    periodStart: usage.periodStart,
    periodEnd: usage.periodEnd,
    meters: {
      [UsageMetricKey.Credits]: usage.credits,
      [UsageMetricKey.Conversations]: usage.conversations,
      [UsageMetricKey.Chunks]: usage.chunks,
    },
  };
};

export const toUsageStatus = (data: UsageStatusQuery | undefined): UsageStatusView | null =>
  data === undefined
    ? null
    : {
        limitReached: data.usageStatus.limitReached,
        reachedAt: data.usageStatus.reachedAt ?? null,
        periodEnd: data.usageStatus.periodEnd,
      };
