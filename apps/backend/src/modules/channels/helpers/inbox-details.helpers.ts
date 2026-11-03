import { IdPrefix } from '@agent-ic/contracts';
import {
  AGENT_OUTCOME_REASON_FIELD_NAME,
  AgentExitKind,
  EscalationMode,
  NodeType,
  RecipientsKind,
} from '@agent-ic/flow';
import type { EscalationNode, FlowDocument, FlowNode } from '@agent-ic/flow';
import type {
  InboxDetailsGuard,
  InboxDetailsHandler,
  InboxDetailsNotified,
  InboxDetailsRun,
  InboxDetailsRunStep,
} from '@/modules/channels/typedefs/inbox-details.typedefs';
import { MessageSystemEvent } from '@/modules/conversations';
import type { Message } from '@/modules/conversations';
import { RunStepStatus } from '@/modules/runs';
import type { Run, RunStep } from '@/modules/runs';
import type { IdService } from '@/platform/ids/services/id.service';

export type EscalationNotify = Extract<
  EscalationNode['config'],
  { readonly mode: EscalationMode.Escalate }
>['notify'];

const nodeOf = (flow: FlowDocument, step: RunStep): FlowNode | null =>
  flow.nodes.find((node) => node.id === step.nodeId) ?? null;

const textOf = (value: unknown): string | null =>
  typeof value === 'string' && value !== '' ? value : null;

const handoffReason = (node: FlowNode | null): string | null =>
  node?.type === NodeType.Agent ? textOf(node.config.exits.handoff?.when) : null;

const escalationReason = (steps: readonly RunStep[], flow: FlowDocument): string | null => {
  for (const step of steps) {
    const node = nodeOf(flow, step);
    if (node?.type === NodeType.Escalation) {
      const reason = textOf(step.output?.['reason']);
      if (reason !== null) {
        return reason;
      }
    }
  }
  return null;
};

export const guardOf = (
  steps: readonly RunStep[],
  flow: FlowDocument,
): InboxDetailsGuard | null => {
  const completion = steps.find((candidate) => {
    const node = nodeOf(flow, candidate);
    return node?.type === NodeType.Completion && candidate.output?.['needs_human'] === true;
  });
  if (completion !== undefined) {
    const node = nodeOf(flow, completion);
    return {
      label: node?.label === undefined || node.label === '' ? completion.nodeKey : node.label,
      nodeType: NodeType.Completion,
      reason: textOf(completion.output?.['reason']) ?? escalationReason(steps, flow),
    };
  }
  const handoff = [...steps].reverse().find((candidate) => {
    const node = nodeOf(flow, candidate);
    return (
      (node?.type === NodeType.Agent || node?.type === NodeType.Completion) &&
      (candidate.port === AgentExitKind.Handoff || candidate.status === RunStepStatus.Failed)
    );
  });
  if (handoff !== undefined) {
    const node = nodeOf(flow, handoff);
    return {
      label: '',
      nodeType: node?.type ?? NodeType.Agent,
      reason:
        textOf(handoff.output?.[AGENT_OUTCOME_REASON_FIELD_NAME]) ??
        handoffReason(node) ??
        textOf(handoff.error?.message) ??
        escalationReason(steps, flow),
    };
  }
  const escalation = steps.find(
    (candidate) => nodeOf(flow, candidate)?.type === NodeType.Escalation,
  );
  if (escalation !== undefined) {
    const node = nodeOf(flow, escalation);
    return {
      label: node?.label === undefined || node.label === '' ? escalation.nodeKey : node.label,
      nodeType: NodeType.Escalation,
      reason: escalationReason(steps, flow),
    };
  }
  return null;
};

const routerValue = (node: FlowNode | null, port: string | null): string | null => {
  if (node?.type !== NodeType.Router || port === null) {
    return null;
  }
  const rule = node.config.rules.find((candidate) => candidate.id === port);
  return `→ ${rule?.label === undefined || rule.label === '' ? port : rule.label}`;
};

const stepValue = (step: RunStep, node: FlowNode | null): string | null => {
  if (node?.type === NodeType.Completion) {
    const needsHuman = step.output?.['needs_human'];
    if (typeof needsHuman === 'boolean') {
      return `needs_human = ${needsHuman}`;
    }
  }
  return routerValue(node, step.port);
};

const runStepOf = (step: RunStep, flow: FlowDocument, ids: IdService): InboxDetailsRunStep => {
  const node = nodeOf(flow, step);
  return {
    id: ids.toPublic(IdPrefix.RunStep, step.id),
    nodeId: step.nodeId,
    label: node?.label === undefined || node.label === '' ? step.nodeKey : node.label,
    nodeType: node?.type ?? null,
    status: step.status,
    value: stepValue(step, node),
  };
};

export const runOf = (
  run: Run,
  steps: readonly RunStep[],
  flow: FlowDocument,
  ids: IdService,
  agentVersion: number | null,
): InboxDetailsRun => ({
  id: ids.toPublic(IdPrefix.Run, run.id),
  agentVersion,
  startedAt: run.startedAt ?? run.createdAt,
  durationMs:
    run.startedAt === null || run.finishedAt === null
      ? null
      : run.finishedAt.getTime() - run.startedAt.getTime(),
  steps: steps.map((step) => runStepOf(step, flow, ids)),
});

export const escalationNotifyOf = (
  steps: readonly RunStep[],
  flow: FlowDocument,
): EscalationNotify | null => {
  for (const step of steps) {
    const node = nodeOf(flow, step);
    if (node?.type === NodeType.Escalation && node.config.mode === EscalationMode.Escalate) {
      return node.config.notify;
    }
  }
  return flow.settings.handoff?.notify ?? null;
};

export const handlerOf = (
  messages: readonly Message[],
  handledBy: string | null,
  names: ReadonlyMap<string, string>,
): InboxDetailsHandler | null => {
  const tookOver =
    [...messages]
      .reverse()
      .find((message) => message.systemEvent === MessageSystemEvent.TookOver) ?? null;
  const userId = tookOver === null ? handledBy : tookOver.authorUserId;
  if (userId === null) {
    return null;
  }
  const name = names.get(userId);
  if (name === undefined) {
    return null;
  }
  const until =
    tookOver === null
      ? null
      : (messages.find(
          (message) =>
            message.systemEvent === MessageSystemEvent.HandedBack &&
            message.createdAt > tookOver.createdAt,
        )?.createdAt ?? null);
  return { name, since: tookOver?.createdAt ?? null, until };
};

export const notifiedOf = (
  notify: EscalationNotify,
  names: readonly string[],
): InboxDetailsNotified => ({
  names: notify.recipients.kind === RecipientsKind.Operators ? [] : names,
  allOperators: notify.recipients.kind === RecipientsKind.Operators,
  channels: notify.channels,
});
