import { CompletionRole, FailureMode } from '../../nodes/constants/step.constants';
import { NodeType, PortName } from '../constants/flow.constants';
import type { FlowNode } from '../typedefs/flow.typedefs';

const STEP_PORTS: readonly string[] = [PortName.Next, PortName.Error];
const NEXT_ONLY: readonly string[] = [PortName.Next];
const NO_PORTS: readonly string[] = [];

export const nodePorts = (node: FlowNode): readonly string[] => {
  switch (node.type) {
    case NodeType.TriggerMessage:
    case NodeType.TriggerExternalEvent:
    case NodeType.TriggerSchedule:
    case NodeType.SendMessage:
      return NEXT_ONLY;
    case NodeType.Agent:
      return STEP_PORTS;
    case NodeType.Completion:
      return node.config.role === CompletionRole.Guard ? STEP_PORTS : NO_PORTS;
    case NodeType.Router:
      return [...node.config.rules.map((rule) => rule.id), PortName.Else];
    case NodeType.Parallel:
      return [PortName.Branches, PortName.Next];
    case NodeType.ApiRequest:
      return node.config.onFailure === FailureMode.ErrorPort ? STEP_PORTS : NEXT_ONLY;
    case NodeType.Escalation:
      return NO_PORTS;
  }
};
