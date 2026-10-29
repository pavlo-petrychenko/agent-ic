import type { ChannelKind } from '@agent-ic/contracts';
import {
  InactivityActivity,
  ModelProviderKind,
  NodeType,
  fireOffsetsMinutes,
} from '@agent-ic/flow';
import type { FlowDocument, FlowNode, ModelRef, TriggerInactivityNode } from '@agent-ic/flow';
import { ConversationMode, MessageAuthor, MessageDelivery } from '@/modules/conversations';
import type { Conversation, Message } from '@/modules/conversations';
import { CHANNEL_TYPE_OF_KIND } from '@/modules/runs/constants/inactivity.constants';
import type { InactivityTimer } from '@/modules/runs/typedefs/inactivity-timer.typedefs';
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

export const isInactivityTimerDue = (timer: Pick<InactivityTimer, 'dueAt'>, now: Date): boolean =>
  timer.dueAt !== null && timer.dueAt.getTime() <= now.getTime();

export const silentMinutesSince = (anchor: Date, now: Date): number =>
  Math.max(
    0,
    Math.floor((now.getTime() - anchor.getTime()) / (SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND)),
  );

export const reachesChannel = (node: TriggerInactivityNode, kind: ChannelKind): boolean => {
  const selected = node.config.conditions.channelTypes;
  const type = CHANNEL_TYPE_OF_KIND[kind];
  return selected.length === 0 || type === null || selected.includes(type);
};

export const lastAgentMessageFailed = (
  latest: Pick<Message, 'author' | 'delivery'> | null,
): boolean => latest?.author === MessageAuthor.Agent && latest.delivery === MessageDelivery.Failed;

const stepModel = (node: FlowNode): ModelRef | null | undefined =>
  node.type === NodeType.Agent || node.type === NodeType.Completion ? node.config.model : undefined;

export const usesPlatformModel = (flow: FlowDocument): boolean =>
  flow.nodes.some((node) => {
    const model = stepModel(node);
    return model === null || model?.provider.kind === ModelProviderKind.Platform;
  });
