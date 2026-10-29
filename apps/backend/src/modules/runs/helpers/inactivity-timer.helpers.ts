import { InactivityActivity, NodeType, fireOffsetsMinutes } from '@agent-ic/flow';
import type { FlowDocument, FlowNode, TriggerInactivityNode } from '@agent-ic/flow';
import { ConversationMode } from '@/modules/conversations';
import type { Conversation } from '@/modules/conversations';
import {
  MILLISECONDS_PER_SECOND,
  SECONDS_PER_MINUTE,
} from '@/platform/clock/constants/time.constants';

const isInactivityTrigger = (node: FlowNode): node is TriggerInactivityNode =>
  node.type === NodeType.TriggerInactivity;

export const inactivityTriggerOf = (flow: FlowDocument): TriggerInactivityNode | null =>
  flow.nodes.find(isInactivityTrigger) ?? null;

export const inactivityAnchor = (
  node: TriggerInactivityNode,
  conversation: Pick<Conversation, 'lastCustomerMessageAt'>,
  now: Date,
): Date =>
  node.config.activity === InactivityActivity.Customer
    ? (conversation.lastCustomerMessageAt ?? now)
    : now;

export const fireOffsetMinutes = (node: TriggerInactivityNode, attempt: number): number | null =>
  fireOffsetsMinutes(node)[attempt] ?? null;

export const inactivityDueAt = (
  mode: ConversationMode,
  anchor: Date,
  offsetMinutes: number,
): Date | null =>
  mode === ConversationMode.Simulation
    ? null
    : new Date(anchor.getTime() + offsetMinutes * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND);
