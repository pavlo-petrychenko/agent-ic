import { WorkspaceRole } from '@agent-ic/contracts';
import {
  ChannelSelectionMode,
  ConditionOperator,
  ESCALATION_DEFAULT_FALLBACK_MINUTES,
  ESCALATION_DEFAULT_REMINDER_MINUTES,
  EscalationMode,
  FLOW_SCHEMA_VERSION,
  MessageContentKind,
  NodeType,
  NotifyChannel,
  PortName,
  QuickRepliesKind,
  RecipientsKind,
  RuleMatch,
} from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import {
  SAMPLE_GREETING_TEXT,
  SAMPLE_HAND_OFF_CUSTOMER_MESSAGE,
  SAMPLE_HAND_OFF_FALLBACK_MESSAGE,
  SAMPLE_HAND_OFF_PHRASE,
  SAMPLE_HAND_OFF_REASON,
  SAMPLE_MESSAGE_VARIABLE,
  SAMPLE_NODE_LABELS,
  SAMPLE_NODE_POSITIONS,
  SAMPLE_RULE_LABEL,
  SampleNodeKey,
} from '@/modules/agents/constants/sample-agent.constants';
import type { SampleFlowIds } from '@/modules/agents/typedefs/sample-agent.typedefs';

const nodeBase = (key: SampleNodeKey, id: string) => ({
  id,
  key,
  label: SAMPLE_NODE_LABELS[key],
  position: { ...SAMPLE_NODE_POSITIONS[key] },
});

export const sampleAgentFlow = (ids: SampleFlowIds): FlowDocument => {
  const [toRoute, toHandOff, toGreeting] = ids.edges;
  return {
    schemaVersion: FLOW_SCHEMA_VERSION,
    nodes: [
      {
        ...nodeBase(SampleNodeKey.Trigger, ids.nodes.trigger),
        type: NodeType.TriggerMessage,
        config: { channels: { mode: ChannelSelectionMode.All } },
      },
      {
        ...nodeBase(SampleNodeKey.Route, ids.nodes.route),
        type: NodeType.Router,
        config: {
          rules: [
            {
              id: ids.rule,
              label: SAMPLE_RULE_LABEL,
              match: RuleMatch.All,
              conditions: [
                {
                  variable: SAMPLE_MESSAGE_VARIABLE,
                  operator: ConditionOperator.Contains,
                  value: SAMPLE_HAND_OFF_PHRASE,
                },
              ],
            },
          ],
        },
      },
      {
        ...nodeBase(SampleNodeKey.Greeting, ids.nodes.greeting),
        type: NodeType.SendMessage,
        config: {
          content: { kind: MessageContentKind.Text, text: SAMPLE_GREETING_TEXT },
          typing: true,
          waitForDelivery: true,
          quickReplies: { kind: QuickRepliesKind.None },
        },
      },
      {
        ...nodeBase(SampleNodeKey.HandOff, ids.nodes.handOff),
        type: NodeType.Escalation,
        config: {
          mode: EscalationMode.Escalate,
          customerMessage: SAMPLE_HAND_OFF_CUSTOMER_MESSAGE,
          reason: SAMPLE_HAND_OFF_REASON,
          notify: {
            recipients: { kind: RecipientsKind.Role, role: WorkspaceRole.Operator },
            channels: [NotifyChannel.InPlatform],
          },
          reminderAfterMinutes: ESCALATION_DEFAULT_REMINDER_MINUTES,
          fallbackAfterMinutes: ESCALATION_DEFAULT_FALLBACK_MINUTES,
          fallbackMessage: SAMPLE_HAND_OFF_FALLBACK_MESSAGE,
        },
      },
    ],
    edges: [
      {
        id: toRoute,
        source: ids.nodes.trigger,
        sourcePort: PortName.Next,
        target: ids.nodes.route,
      },
      { id: toHandOff, source: ids.nodes.route, sourcePort: ids.rule, target: ids.nodes.handOff },
      {
        id: toGreeting,
        source: ids.nodes.route,
        sourcePort: PortName.Else,
        target: ids.nodes.greeting,
      },
    ],
  };
};
