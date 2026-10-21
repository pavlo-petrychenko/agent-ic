import type {
  UsageStatus as UsageStatusView,
  WorkspaceUsage as WorkspaceUsageView,
} from '@/modules/usage/typedefs/usage.typedefs';
import type {
  UsageStatus,
  WorkspaceUsage,
} from '@/platform/graphql-server/generated/schema.generated';

export const toGraphqlWorkspaceUsage = (usage: WorkspaceUsageView): WorkspaceUsage => ({
  periodStart: usage.periodStart.toISOString(),
  periodEnd: usage.periodEnd.toISOString(),
  credits: usage.credits,
  conversations: usage.conversations,
  chunks: usage.chunks,
});

export const toGraphqlUsageStatus = (status: UsageStatusView): UsageStatus => ({
  limitReached: status.limitReached,
  reachedAt: status.reachedAt?.toISOString() ?? null,
  periodEnd: status.periodEnd.toISOString(),
});
