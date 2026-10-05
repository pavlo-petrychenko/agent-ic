import { FIXED_PORT_NAMES, NodeType, PortName } from '@flow/document/constants/flow.constants';
import type {
  AgentNode,
  CompletionNode,
  FlowNode,
  ParallelNode,
  RouterNode,
  TriggerExternalEventNode,
  TriggerScheduleNode,
} from '@flow/document/typedefs/flow.typedefs';
import {
  MAX_PARALLEL_BRANCHES,
  MIN_PARALLEL_BRANCHES,
} from '@flow/limits/constants/limit.constants';
import { FailureMode } from '@flow/nodes/constants/step.constants';
import { ScheduleKind } from '@flow/nodes/constants/trigger.constants';
import { AGENT_MESSAGES_FIELD_NAME } from '@flow/outputs/constants/output.constants';
import {
  branchNodes,
  branchStarts,
  incomingEdges,
  outgoingEdges,
} from '@flow/scope/helpers/graph.helpers';
import { FlowIssueCode } from '@flow/validation/constants/issue.constants';
import { createIssue, duplicates } from '@flow/validation/helpers/issue.helpers';
import { isValidCron, isValidTimeZone } from '@flow/validation/helpers/schedule.helpers';
import type { FlowIssue, ValidationContext } from '@flow/validation/typedefs/validation.typedefs';

const llmStepIssues = (node: AgentNode | CompletionNode): FlowIssue[] => {
  const issues: FlowIssue[] = [];
  if (node.config.prompt === null) {
    issues.push(createIssue(FlowIssueCode.MissingPrompt, { nodeId: node.id, path: ['prompt'] }));
  }
  if (node.config.model === null) {
    issues.push(createIssue(FlowIssueCode.MissingModel, { nodeId: node.id, path: ['model'] }));
  }
  const taken = new Set(node.type === NodeType.Agent ? [AGENT_MESSAGES_FIELD_NAME] : []);
  node.config.output.forEach((field, index) => {
    if (taken.has(field.name)) {
      issues.push(
        createIssue(FlowIssueCode.DuplicateOutputField, {
          nodeId: node.id,
          path: ['output', String(index), 'name'],
          params: { field: field.name },
        }),
      );
    }
    taken.add(field.name);
  });
  return issues;
};

const routerIssues = (node: RouterNode): FlowIssue[] => {
  const { rules } = node.config;
  const duplicateIds = new Set(duplicates(rules, (rule) => rule.id));
  return rules.flatMap((rule, index) => {
    const path = ['rules', String(index)];
    const issues: FlowIssue[] = [];
    if (duplicateIds.has(rule)) {
      issues.push(
        createIssue(FlowIssueCode.DuplicateRuleId, {
          nodeId: node.id,
          path: [...path, 'id'],
          params: { rule: rule.id },
        }),
      );
    }
    if (FIXED_PORT_NAMES.includes(rule.id)) {
      issues.push(
        createIssue(FlowIssueCode.InvalidRuleId, {
          nodeId: node.id,
          path: [...path, 'id'],
          params: { rule: rule.id },
        }),
      );
    }
    if (rule.conditions.length === 0) {
      issues.push(
        createIssue(FlowIssueCode.RuleWithoutConditions, {
          nodeId: node.id,
          path: [...path, 'conditions'],
          params: { rule: rule.id },
        }),
      );
    }
    return issues;
  });
};

const eventTriggerIssues = (node: TriggerExternalEventNode): FlowIssue[] => {
  const issues: FlowIssue[] = [];
  if (node.config.eventName === null) {
    issues.push(
      createIssue(FlowIssueCode.MissingEventName, { nodeId: node.id, path: ['eventName'] }),
    );
  }
  if (node.config.channelId === null) {
    issues.push(
      createIssue(FlowIssueCode.MissingChannel, { nodeId: node.id, path: ['channelId'] }),
    );
  }
  return issues;
};

const scheduleTriggerIssues = (node: TriggerScheduleNode): FlowIssue[] => {
  const { schedule } = node.config;
  const issues: FlowIssue[] = [];
  if (schedule.kind === ScheduleKind.Custom && !isValidCron(schedule.cron)) {
    issues.push(
      createIssue(FlowIssueCode.InvalidCron, {
        nodeId: node.id,
        path: ['schedule', 'cron'],
        params: { cron: schedule.cron },
      }),
    );
  }
  if (!isValidTimeZone(schedule.timeZone)) {
    issues.push(
      createIssue(FlowIssueCode.InvalidTimeZone, {
        nodeId: node.id,
        path: ['schedule', 'timeZone'],
        params: { timeZone: schedule.timeZone },
      }),
    );
  }
  return issues;
};

const nodeConfigIssues = (context: ValidationContext, node: FlowNode): FlowIssue[] => {
  switch (node.type) {
    case NodeType.Agent:
    case NodeType.Completion:
      return llmStepIssues(node);
    case NodeType.Router:
      return routerIssues(node);
    case NodeType.TriggerExternalEvent:
      return eventTriggerIssues(node);
    case NodeType.TriggerSchedule:
      return scheduleTriggerIssues(node);
    case NodeType.ApiRequest:
      return node.config.onFailure === FailureMode.ErrorPort &&
        outgoingEdges(context.graph, node.id, PortName.Error).length === 0
        ? [
            createIssue(FlowIssueCode.ErrorPortNotConnected, {
              nodeId: node.id,
              path: ['onFailure'],
            }),
          ]
        : [];
    case NodeType.TriggerMessage:
    case NodeType.Parallel:
    case NodeType.SendMessage:
    case NodeType.Escalation:
      return [];
  }
};

const eventNameIssues = ({ flow }: ValidationContext): FlowIssue[] => {
  const named = flow.nodes.flatMap((node) =>
    node.type === NodeType.TriggerExternalEvent && node.config.eventName !== null
      ? [{ node, eventName: node.config.eventName }]
      : [],
  );
  return duplicates(named, (entry) => entry.eventName).map(({ node, eventName }) =>
    createIssue(FlowIssueCode.DuplicateEventName, {
      nodeId: node.id,
      path: ['eventName'],
      params: { eventName },
    }),
  );
};

export const stepIssues = (context: ValidationContext): FlowIssue[] => [
  ...context.flow.nodes.flatMap((node) => nodeConfigIssues(context, node)),
  ...eventNameIssues(context),
];

const parallelBranchIssues = (context: ValidationContext, node: ParallelNode): FlowIssue[] => {
  const starts = branchStarts(context.graph, node.id);
  const issues: FlowIssue[] = [];
  if (starts.length < MIN_PARALLEL_BRANCHES) {
    issues.push(
      createIssue(FlowIssueCode.TooFewBranches, {
        nodeId: node.id,
        params: { count: starts.length },
      }),
    );
  }
  if (starts.length > MAX_PARALLEL_BRANCHES) {
    issues.push(
      createIssue(FlowIssueCode.TooManyBranches, {
        nodeId: node.id,
        params: { count: starts.length },
      }),
    );
  }
  const leaks = new Set<string>();
  for (const start of starts) {
    const inside = branchNodes(context.graph, start);
    for (const id of inside) {
      for (const edge of incomingEdges(context.graph, id)) {
        if (edge.id !== start.id && !inside.has(edge.source) && edge.source !== node.id) {
          leaks.add(edge.id);
        }
        if (edge.source === node.id && edge.sourcePort !== PortName.Branches) {
          leaks.add(edge.id);
        }
      }
    }
  }
  return [
    ...issues,
    ...[...leaks].map((edgeId) =>
      createIssue(FlowIssueCode.ParallelBranchLeak, { nodeId: node.id, edgeId }),
    ),
  ];
};

export const parallelIssues = (context: ValidationContext): FlowIssue[] => [
  ...context.flow.nodes.flatMap((node) =>
    node.type === NodeType.Parallel ? parallelBranchIssues(context, node) : [],
  ),
  ...context.flow.nodes
    .filter(
      (node) =>
        context.inBranches.has(node.id) &&
        (node.type === NodeType.SendMessage || node.type === NodeType.Escalation),
    )
    .map((node) => createIssue(FlowIssueCode.SendInParallelBranch, { nodeId: node.id })),
];
