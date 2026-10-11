import { useQuery } from '@apollo/client/react';
import { AgentCountDocument } from '@/features/workspace/communication/gql/query/agentCount.generated';

export function useAgentCount(): number {
  const { data } = useQuery(AgentCountDocument);
  return data?.agentCount ?? 0;
}
