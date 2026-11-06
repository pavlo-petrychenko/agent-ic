import { useQuery } from '@apollo/client/react';
import { InboxFilterOptionsDocument } from '@/features/inbox/communication/gql/query/inboxFilterOptions.generated';
import type { InboxFilterOptions } from '@/features/inbox/typedefs/filters.typedefs';

const EMPTY_OPTIONS: InboxFilterOptions = { channels: [], agents: [] };

export function useInboxFilterOptions(): InboxFilterOptions {
  const { data } = useQuery(InboxFilterOptionsDocument, {
    fetchPolicy: 'cache-and-network',
  });
  return data?.inboxFilterOptions ?? EMPTY_OPTIONS;
}
