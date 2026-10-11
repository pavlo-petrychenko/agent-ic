import { EscalationMode, NodeType, RecipientsKind } from '@agent-ic/flow';
import type { EscalationNode, FlowDocument, NotifyChannel } from '@agent-ic/flow';
import { RECIPIENT_ROLES } from '@/features/flow-builder/constants/escalation.constants';
import { NODE_TEMPLATES } from '@/features/flow-builder/constants/nodeTemplate.constants';
import { updateNode } from '@/features/flow-builder/logic/helpers/inspector.helpers';
import type {
  EscalatePatch,
  EscalationRecipients,
} from '@/features/flow-builder/typedefs/escalation.typedefs';

const updateEscalation = (
  document: FlowDocument,
  nodeId: string,
  update: (config: EscalationNode['config']) => EscalationNode['config'],
): FlowDocument =>
  updateNode(document, nodeId, (node) =>
    node.type === NodeType.Escalation ? { ...node, config: update(node.config) } : node,
  );

export const setEscalationMode = (
  document: FlowDocument,
  nodeId: string,
  mode: EscalationMode,
): FlowDocument =>
  updateEscalation(document, nodeId, (config) => {
    if (config.mode === mode) {
      return config;
    }
    const { customerMessage } = config;
    return mode === EscalationMode.End
      ? { mode, customerMessage }
      : { ...NODE_TEMPLATES[NodeType.Escalation].config, customerMessage };
  });

export const setCustomerMessage = (
  document: FlowDocument,
  nodeId: string,
  text: string,
): FlowDocument =>
  updateEscalation(document, nodeId, (config) => ({
    ...config,
    customerMessage: text === '' ? null : text,
  }));

export const updateEscalate = (
  document: FlowDocument,
  nodeId: string,
  patch: EscalatePatch,
): FlowDocument =>
  updateEscalation(document, nodeId, (config) =>
    config.mode === EscalationMode.Escalate ? { ...config, ...patch } : config,
  );

export const recipientsValue = (config: EscalationNode['config']): string => {
  if (config.mode === EscalationMode.End) {
    return RecipientsKind.Operators;
  }
  const { recipients } = config.notify;
  return recipients.kind === RecipientsKind.Role ? recipients.role : recipients.kind;
};

export const recipientsFromValue = (value: string): EscalationRecipients | null => {
  if (value === RecipientsKind.Operators) {
    return { kind: RecipientsKind.Operators };
  }
  const role = RECIPIENT_ROLES.find((candidate) => candidate === value);
  return role === undefined ? null : { kind: RecipientsKind.Role, role };
};

export const setRecipients = (
  document: FlowDocument,
  nodeId: string,
  value: string,
): FlowDocument => {
  const recipients = recipientsFromValue(value);
  return recipients === null
    ? document
    : updateEscalation(document, nodeId, (config) =>
        config.mode === EscalationMode.Escalate
          ? { ...config, notify: { ...config.notify, recipients } }
          : config,
      );
};

export const setChannel = (
  document: FlowDocument,
  nodeId: string,
  channel: NotifyChannel,
  on: boolean,
): FlowDocument =>
  updateEscalation(document, nodeId, (config) => {
    if (config.mode !== EscalationMode.Escalate) {
      return config;
    }
    const others = config.notify.channels.filter((current) => current !== channel);
    const channels = on ? [...others, channel] : others;
    return channels.length === 0 ? config : { ...config, notify: { ...config.notify, channels } };
  });
