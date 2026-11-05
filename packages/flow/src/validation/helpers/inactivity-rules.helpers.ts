import { NodeType } from '@flow/document/constants/flow.constants';
import type { FlowNode, TriggerInactivityNode } from '@flow/document/typedefs/flow.typedefs';
import {
  MAX_INACTIVITY_MINUTES,
  MIN_INACTIVITY_MINUTES,
} from '@flow/limits/constants/limit.constants';
import { InactivityRepeatKind } from '@flow/nodes/constants/trigger.constants';
import { durationMinutes, fireOffsetsMinutes } from '@flow/nodes/helpers/inactivity.helpers';
import { reachableFrom } from '@flow/scope/helpers/graph.helpers';
import { FlowIssueCode } from '@flow/validation/constants/issue.constants';
import { createIssue } from '@flow/validation/helpers/issue.helpers';
import type { FlowIssue, ValidationContext } from '@flow/validation/typedefs/validation.typedefs';

const isInactivityTrigger = (node: FlowNode): node is TriggerInactivityNode =>
  node.type === NodeType.TriggerInactivity;

const isConversationTrigger = (node: FlowNode): boolean =>
  node.type === NodeType.TriggerMessage || node.type === NodeType.TriggerExternalEvent;

const outOfRange = (minutes: number): boolean =>
  minutes < MIN_INACTIVITY_MINUTES || minutes > MAX_INACTIVITY_MINUTES;

const durationIssues = (node: TriggerInactivityNode): FlowIssue[] => {
  const { silence, repeat } = node.config;
  const checked: { path: string[]; minutes: number }[] = [
    { path: ['silence'], minutes: durationMinutes(silence) },
  ];
  if (repeat.kind === InactivityRepeatKind.Every) {
    checked.push({ path: ['repeat', 'every'], minutes: durationMinutes(repeat.every) });
  }
  return checked
    .filter(({ minutes }) => outOfRange(minutes))
    .map(({ path, minutes }) =>
      createIssue(FlowIssueCode.InactivityDurationOutOfRange, {
        nodeId: node.id,
        path,
        params: { minutes, min: MIN_INACTIVITY_MINUTES, max: MAX_INACTIVITY_MINUTES },
      }),
    );
};

export const inactivityIssues = ({ flow }: ValidationContext): FlowIssue[] => {
  const triggers = flow.nodes.filter(isInactivityTrigger);
  const hasConversationTrigger = flow.nodes.some(isConversationTrigger);
  return [
    ...triggers
      .slice(1)
      .map((node) => createIssue(FlowIssueCode.DuplicateInactivityTrigger, { nodeId: node.id })),
    ...(hasConversationTrigger
      ? []
      : triggers.map((node) =>
          createIssue(FlowIssueCode.InactivityWithoutConversationTrigger, { nodeId: node.id }),
        )),
    ...triggers.flatMap(durationIssues),
  ];
};

const sendsReply = (context: ValidationContext, node: TriggerInactivityNode): boolean => {
  const reached = reachableFrom(context.graph, [node.id]);
  return context.flow.nodes.some(
    (candidate) => candidate.type === NodeType.SendMessage && reached.has(candidate.id),
  );
};

export const inactivityWarnings = (
  context: ValidationContext,
  node: TriggerInactivityNode,
): FlowIssue[] => {
  const issues: FlowIssue[] = [];
  if (!sendsReply(context, node)) {
    issues.push(createIssue(FlowIssueCode.InactivityNoReplyStep, { nodeId: node.id }));
  }
  const { autoClose } = context.flow.settings;
  if (
    autoClose !== null &&
    fireOffsetsMinutes(node).some((offset) => offset >= autoClose.afterMinutes)
  ) {
    issues.push(
      createIssue(FlowIssueCode.InactivityAfterAutoClose, {
        nodeId: node.id,
        path: ['silence'],
        params: { afterMinutes: autoClose.afterMinutes },
      }),
    );
  }
  return issues;
};
