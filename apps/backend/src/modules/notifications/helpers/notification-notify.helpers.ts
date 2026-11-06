import { EscalationMode, NodeType } from '@agent-ic/flow';
import type { FlowDocument, FlowNode } from '@agent-ic/flow';
import type { HandoffNotify } from '@/modules/notifications/typedefs/notification-recipients.typedefs';

export const handoffNotifyOf = (
  flow: FlowDocument,
  node: FlowNode | undefined,
): HandoffNotify | null => {
  if (node?.type === NodeType.Escalation) {
    return node.config.mode === EscalationMode.Escalate ? node.config.notify : null;
  }
  return flow.settings.handoff?.notify ?? null;
};
