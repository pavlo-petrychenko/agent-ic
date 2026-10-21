import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { UsageStatusDocument } from '@/features/settings/communication/gql/query/usageStatus.generated';
import { toUsageStatus } from '@/features/settings/communication/helpers/usage.helpers';
import type { UseUsageStatusResult } from '@/features/settings/typedefs/usage.typedefs';

export function useUsageStatus(): UseUsageStatusResult {
  const { data } = useQuery(UsageStatusDocument, { fetchPolicy: 'cache-and-network' });
  const status = useMemo(() => toUsageStatus(data), [data]);
  return { status, limitReached: status?.limitReached ?? false };
}
