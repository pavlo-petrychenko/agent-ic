import { useQuery } from '@apollo/client/react';
import { AgentCountDocument } from '@/features/workspace/communication/gql/query/agentCount.generated';

export function useAgentCount(enabled: boolean): number {
  const { data } = useQuery(AgentCountDocument, { skip: !enabled });
  return data?.agentCount ?? 0;
}
