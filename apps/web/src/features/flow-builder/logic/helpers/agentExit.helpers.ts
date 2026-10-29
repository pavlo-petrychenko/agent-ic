import {
  AGENT_EXIT_KINDS,
  isExitPort,
  AGENT_MESSAGES_FIELD_NAME,
  AGENT_OUTCOME_REASON_FIELD_NAME,
  AgentExitKind,
  EscalationMode,
  FlowIssueCode,
  MessageContentKind,
  NodeType,
  PROMPT_VARIABLE_CLOSE,
  PROMPT_VARIABLE_OPEN,
  PortName,
} from '@agent-ic/flow';
import type {
  AgentExit,
  AgentExits,
  AgentNode,
  EscalationNode,
  FlowDocument,
  FlowIssue,
  FlowNode,
} from '@agent-ic/flow';
import {
  EXIT_COLUMN_STEP_X,
  EXIT_FINISH_OFFSET_Y,
  EXIT_SEND_OFFSET_Y,
  EXIT_STEP_CLEARANCE,
  EXIT_STEP_FOOTPRINT,
  EXIT_STEPS_OFFSET_X,
} from '@/features/flow-builder/constants/agentExit.constants';
import { DEFAULT_HANDOFF } from '@/features/flow-builder/constants/nodeTemplate.constants';
import { connect } from '@/features/flow-builder/logic/helpers/connection.helpers';
import { addNode } from '@/features/flow-builder/logic/helpers/graphEdit.helpers';
import { nodeName, updateNode } from '@/features/flow-builder/logic/helpers/inspector.helpers';
import type {
  CustomizedExit,
  ExitStepLabels,
} from '@/features/flow-builder/typedefs/agentExit.typedefs';

export const paletteAgentExits = (handoffWhen: string): AgentExits => ({
  [AgentExitKind.End]: null,
  [AgentExitKind.Handoff]: { when: handoffWhen },
});

export const withAgentExits = (node: FlowNode, exits: AgentExits): FlowNode =>
  node.type === NodeType.Agent ? { ...node, config: { ...node.config, exits } } : node;

export const setAgentExit = (
  document: FlowDocument,
  nodeId: string,
  kind: AgentExitKind,
  exit: AgentExit | null,
): FlowDocument => {
  const updated = updateNode(document, nodeId, (node) =>
    node.type === NodeType.Agent
      ? withAgentExits(node, { ...node.config.exits, [kind]: exit })
      : node,
  );
  return exit === null
    ? {
        ...updated,
        edges: updated.edges.filter((edge) => edge.source !== nodeId || edge.sourcePort !== kind),
      }
    : updated;
};

export const secondMessageStep = (
  document: FlowDocument,
  issues: readonly FlowIssue[],
  nodeId: string,
  kind: AgentExitKind,
): string | null => {
  const issue = issues.find(
    (candidate) =>
      candidate.code === FlowIssueCode.ExitEscalationMessage &&
      candidate.nodeId === nodeId &&
      candidate.params.exit === kind,
  );
  const edge = document.edges.find((candidate) => candidate.id === issue?.edgeId);
  const target = document.nodes.find((candidate) => candidate.id === edge?.target);
  return target === undefined ? null : nodeName(target);
};

export const exitKindOf = (port: string): AgentExitKind | null =>
  AGENT_EXIT_KINDS.find((kind) => kind === port) ?? null;

const finishConfig = (
  document: FlowDocument,
  agent: AgentNode,
  kind: AgentExitKind,
): EscalationNode['config'] => {
  if (kind === AgentExitKind.End) {
    return { mode: EscalationMode.End, customerMessage: null };
  }
  return {
    mode: EscalationMode.Escalate,
    customerMessage: null,
    reason: `${PROMPT_VARIABLE_OPEN}${agent.key}.${AGENT_OUTCOME_REASON_FIELD_NAME}${PROMPT_VARIABLE_CLOSE}`,
    ...structuredClone(document.settings.handoff ?? DEFAULT_HANDOFF),
  };
};

const columnIsFree = (document: FlowDocument, x: number, top: number): boolean => {
  const bottom = top + EXIT_FINISH_OFFSET_Y - EXIT_SEND_OFFSET_Y + EXIT_STEP_FOOTPRINT.height;
  return document.nodes.every(
    (node) =>
      node.position.x >= x + EXIT_STEP_FOOTPRINT.width + EXIT_STEP_CLEARANCE ||
      node.position.x + EXIT_STEP_FOOTPRINT.width + EXIT_STEP_CLEARANCE <= x ||
      node.position.y >= bottom + EXIT_STEP_CLEARANCE ||
      node.position.y + EXIT_STEP_FOOTPRINT.height + EXIT_STEP_CLEARANCE <= top,
  );
};

export const freeExitColumn = (document: FlowDocument, x: number, top: number): number => {
  let column = x;
  while (!columnIsFree(document, column, top)) {
    column += EXIT_COLUMN_STEP_X;
  }
  return column;
};

export const customizeExit = (
  document: FlowDocument,
  nodeId: string,
  kind: AgentExitKind,
  labels: ExitStepLabels,
  createId: () => string,
): CustomizedExit => {
  const agent = document.nodes.find((node) => node.id === nodeId);
  const taken = document.edges.some((edge) => edge.source === nodeId && edge.sourcePort === kind);
  if (agent?.type !== NodeType.Agent || agent.config.exits[kind] === null || taken) {
    return { document, nodeIds: [] };
  }
  const sendId = createId();
  const finishId = createId();
  const x = freeExitColumn(
    document,
    agent.position.x + EXIT_STEPS_OFFSET_X[kind],
    agent.position.y + EXIT_SEND_OFFSET_Y,
  );
  const withSend = addNode(
    document,
    NodeType.SendMessage,
    { x, y: agent.position.y + EXIT_SEND_OFFSET_Y },
    sendId,
  );
  const withFinish = addNode(
    withSend,
    NodeType.Escalation,
    { x, y: agent.position.y + EXIT_FINISH_OFFSET_Y },
    finishId,
  );
  const filled: FlowDocument = {
    ...withFinish,
    nodes: withFinish.nodes.map((node) => {
      if (node.id === sendId && node.type === NodeType.SendMessage) {
        return {
          ...node,
          label: labels.send,
          config: {
            ...node.config,
            content: {
              kind: MessageContentKind.List,
              variable: `${agent.key}.${AGENT_MESSAGES_FIELD_NAME}`,
            },
          },
        };
      }
      if (node.id === finishId && node.type === NodeType.Escalation) {
        return { ...node, label: labels.finish, config: finishConfig(document, agent, kind) };
      }
      return node;
    }),
  };
  const linked = connect(
    connect(filled, { source: nodeId, sourcePort: kind, target: sendId }, createId()),
    { source: sendId, sourcePort: PortName.Next, target: finishId },
    createId(),
  );
  return { document: linked, nodeIds: [sendId, finishId] };
};

export const defaultExitPorts = (
  document: FlowDocument,
  nodeId: string,
): readonly AgentExitKind[] => {
  const node = document.nodes.find((candidate) => candidate.id === nodeId);
  return node === undefined
    ? []
    : AGENT_EXIT_KINDS.filter(
        (kind) =>
          isExitPort(node, kind) &&
          !document.edges.some((edge) => edge.source === nodeId && edge.sourcePort === kind),
      );
};
