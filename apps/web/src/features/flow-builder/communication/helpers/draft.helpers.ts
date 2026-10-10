import { parseFlow, validateFlow } from '@agent-ic/flow';
import type { FlowBuilderDraftQuery } from '@/features/flow-builder/communication/gql/query/flowBuilderDraft.generated';
import type { FlowDraft } from '@/features/flow-builder/typedefs/flowBuilder.typedefs';

export const toFlowDraft = (data: FlowBuilderDraftQuery): FlowDraft | null => {
  const parsed = parseFlow(data.agentDraft.version.flow);
  return parsed.ok
    ? {
        document: parsed.flow,
        revision: data.agentDraft.revision,
        issues: validateFlow(parsed.flow),
      }
    : null;
};
