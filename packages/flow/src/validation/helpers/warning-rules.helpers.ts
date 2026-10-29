import { NodeType, PortName } from '@flow/document/constants/flow.constants';
import { enabledExits, isExitPort } from '@flow/document/helpers/node.helpers';
import { nodePorts } from '@flow/document/helpers/port.helpers';
import type { AgentNode, FlowNode } from '@flow/document/typedefs/flow.typedefs';
import { EscalationMode } from '@flow/nodes/constants/step.constants';
import { ReplyMode } from '@flow/nodes/constants/trigger.constants';
import { outgoingEdges, reachableFrom } from '@flow/scope/helpers/graph.helpers';
import { FlowIssueCode } from '@flow/validation/constants/issue.constants';
import { createIssue } from '@flow/validation/helpers/issue.helpers';
import type { FlowIssue, ValidationContext } from '@flow/validation/typedefs/validation.typedefs';

const SKIPPED_PORTS: readonly string[] = [PortName.Error, PortName.Branches];

const endsRunSilently = (context: ValidationContext, node: FlowNode, port: string): boolean =>
  node.type === NodeType.SendMessage || (port === PortName.Next && context.inBranches.has(node.id));

const unconnectedPortIssues = (context: ValidationContext, node: FlowNode): FlowIssue[] =>
  nodePorts(node)
    .filter((port) => !SKIPPED_PORTS.includes(port))
    .filter((port) => outgoingEdges(context.graph, node.id, port).length === 0)
    .filter((port) => !endsRunSilently(context, node, port))
    .filter((port) => !isExitPort(node, port))
    .map((port) =>
      createIssue(FlowIssueCode.PortNotConnected, { nodeId: node.id, params: { port } }),
    );

const canFailUnhandled = (context: ValidationContext, node: FlowNode): boolean =>
  (node.type === NodeType.Agent || node.type === NodeType.Completion) &&
  !context.inBackground.has(node.id) &&
  outgoingEdges(context.graph, node.id, PortName.Error).length === 0;

const hasCustomerMessage = (node: FlowNode | undefined): boolean =>
  node?.type === NodeType.Escalation &&
  node.config.customerMessage !== null &&
  node.config.customerMessage.trim().length > 0;

const exitIssues = (context: ValidationContext, node: AgentNode): FlowIssue[] =>
  enabledExits(node).flatMap((exit) => {
    const issues: FlowIssue[] = [];
    if (node.config.exits[exit]?.when.trim().length === 0) {
      issues.push(
        createIssue(FlowIssueCode.EmptyExitCriterion, {
          nodeId: node.id,
          path: ['exits', exit, 'when'],
          params: { exit },
        }),
      );
    }
    for (const edge of outgoingEdges(context.graph, node.id, exit)) {
      if (hasCustomerMessage(context.graph.nodes.get(edge.target))) {
        issues.push(
          createIssue(FlowIssueCode.ExitEscalationMessage, {
            nodeId: node.id,
            edgeId: edge.id,
            params: { exit },
          }),
        );
      }
    }
    return issues;
  });

const nodeWarnings = (context: ValidationContext, node: FlowNode): FlowIssue[] => {
  const issues = unconnectedPortIssues(context, node);
  if (node.type === NodeType.Agent) {
    issues.push(...exitIssues(context, node));
  }
  if (canFailUnhandled(context, node)) {
    issues.push(createIssue(FlowIssueCode.NoErrorPath, { nodeId: node.id }));
  }
  if (
    node.type === NodeType.TriggerExternalEvent &&
    node.config.replyMode === ReplyMode.WaitForResult &&
    ![...reachableFrom(context.graph, [node.id])].some(
      (id) => context.graph.nodes.get(id)?.type === NodeType.SendMessage,
    )
  ) {
    issues.push(
      createIssue(FlowIssueCode.WaitForResultWithoutReply, {
        nodeId: node.id,
        path: ['replyMode'],
      }),
    );
  }
  if (
    node.type === NodeType.Escalation &&
    node.config.mode === EscalationMode.Escalate &&
    node.config.fallbackMessage.trim().length === 0
  ) {
    issues.push(
      createIssue(FlowIssueCode.NoFallbackMessage, { nodeId: node.id, path: ['fallbackMessage'] }),
    );
  }
  return issues;
};

const settingsWarnings = ({ flow }: ValidationContext): FlowIssue[] =>
  flow.settings.handoff !== null && flow.settings.handoff.fallbackMessage.trim().length === 0
    ? [
        createIssue(FlowIssueCode.NoFallbackMessage, {
          path: ['settings', 'handoff', 'fallbackMessage'],
        }),
      ]
    : [];

export const warningIssues = (context: ValidationContext): FlowIssue[] => [
  ...context.flow.nodes
    .filter((node) => context.reachable.has(node.id))
    .flatMap((node) => nodeWarnings(context, node)),
  ...settingsWarnings(context),
];
