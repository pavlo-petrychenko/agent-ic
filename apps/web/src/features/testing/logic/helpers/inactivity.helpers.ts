import { ErrorReason } from '@agent-ic/contracts';
import { NodeType, fireOffsetsMinutes } from '@agent-ic/flow';
import type { FlowDocument, FlowNode, TriggerInactivityNode } from '@agent-ic/flow';
import {
  InactivityAction,
  InactivityRefusal,
  REFUSAL_OUTCOME_FIELD,
} from '@/features/testing/constants/inactivity.constants';
import type { NextInactivity } from '@/features/testing/typedefs/inactivity.typedefs';
import type { SimulatorConversation } from '@/features/testing/typedefs/simulator.typedefs';
import type { AppError } from '@/shared/api/errors/app.error';
import { MessageAuthor, RunTrigger } from '@/shared/api/generated/schema.generated';

const isInactivityTrigger = (node: FlowNode): node is TriggerInactivityNode =>
  node.type === NodeType.TriggerInactivity;

export const inactivityOffsets = (flow: FlowDocument | null): readonly number[] => {
  const node = flow?.nodes.find(isInactivityTrigger) ?? null;
  return node === null ? [] : fireOffsetsMinutes(node);
};

export const followUpsSent = ({
  messages,
  runs,
}: Pick<SimulatorConversation, 'messages' | 'runs'>): number => {
  const lastCustomer =
    messages
      .filter((message) => message.author === MessageAuthor.Customer)
      .map((message) => message.createdAt)
      .toSorted()
      .at(-1) ?? '';
  const newestFirst = runs.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));
  const end = newestFirst.findIndex(
    (run) => run.trigger !== RunTrigger.Inactivity || run.createdAt < lastCustomer,
  );
  return end === -1 ? newestFirst.length : end;
};

export const nextInactivity = (
  flow: FlowDocument | null,
  conversation: Pick<SimulatorConversation, 'messages' | 'runs'>,
): NextInactivity | null => {
  const autoClose = flow?.settings.autoClose?.afterMinutes ?? null;
  const sent = followUpsSent(conversation);
  const offset = inactivityOffsets(flow).at(sent) ?? null;
  if (offset !== null && (autoClose === null || offset < autoClose)) {
    return { action: InactivityAction.Trigger, afterMinutes: offset, attempt: sent + 1 };
  }
  return autoClose === null
    ? null
    : { action: InactivityAction.AutoClose, afterMinutes: autoClose };
};

export const inactivityRefusal = (error: AppError): InactivityRefusal | null => {
  if (error.reason !== ErrorReason.InactivityConditionsNotMet) {
    return null;
  }
  const outcome = error.details[REFUSAL_OUTCOME_FIELD];
  return Object.values(InactivityRefusal).find((refusal) => refusal === outcome) ?? null;
};
