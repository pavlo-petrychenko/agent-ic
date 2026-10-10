import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { FlowBuilderDraftDocument } from '@/features/flow-builder/communication/gql/query/flowBuilderDraft.generated';
import { toFlowDraft } from '@/features/flow-builder/communication/helpers/draft.helpers';
import type { FlowBuilderDraftResult } from '@/features/flow-builder/typedefs/flowBuilder.typedefs';

export function useFlowBuilderDraft(agentId: string): FlowBuilderDraftResult {
  const { data, loading, refetch } = useQuery(FlowBuilderDraftDocument, {
    variables: { agentId },
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });
  const agentDraft = data?.agentDraft ?? null;
  const draft = useMemo(() => (agentDraft === null ? null : toFlowDraft(agentDraft)), [agentDraft]);
  return {
    agentName: data?.agent.name ?? null,
    draft,
    loading,
    failed: !loading && draft === null,
    retry: () => void refetch(),
  };
}
