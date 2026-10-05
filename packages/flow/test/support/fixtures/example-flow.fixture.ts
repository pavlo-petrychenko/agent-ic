import { WorkspaceRole } from '@agent-ic/contracts';
import {
  ConditionOperator,
  RuleMatch,
} from '../../../src/conditions/constants/condition.constants';
import {
  FLOW_SCHEMA_VERSION,
  NodeType,
  PortName,
} from '../../../src/document/constants/flow.constants';
import type {
  FlowDocument,
  ModelRef,
  PromptRef,
} from '../../../src/document/typedefs/flow.typedefs';
import {
  AGENT_DEFAULT_RETRIES,
  API_REQUEST_DEFAULT_RETRIES,
  API_REQUEST_DEFAULT_TIMEOUT_SECONDS,
  ESCALATION_DEFAULT_FALLBACK_MINUTES,
  ESCALATION_DEFAULT_REMINDER_MINUTES,
} from '../../../src/limits/constants/limit.constants';
import {
  CompletionRole,
  EscalationMode,
  FailureMode,
  HttpMethod,
  MessageContentKind,
  NotifyChannel,
  QuickRepliesKind,
  RecipientsKind,
  RequestAuthKind,
  RequestBodyKind,
  RetrievalMode,
  WaitFor,
} from '../../../src/nodes/constants/step.constants';
import {
  ChannelSelectionMode,
  ChannelType,
  ReplyMode,
  ScheduleKind,
} from '../../../src/nodes/constants/trigger.constants';
import { OutputFieldType } from '../../../src/outputs/constants/output.constants';
import {
  ModelProviderKind,
  PromptVersionKind,
} from '../../../src/references/constants/reference.constants';

const at = { x: 0, y: 0 };

export const examplePrompt = (promptId: string): PromptRef => ({
  promptId,
  version: { kind: PromptVersionKind.Latest },
});

export const exampleModel: ModelRef = {
  provider: { kind: ModelProviderKind.Platform },
  model: 'claude-sonnet',
};

export const faqWithHandOffFlow: FlowDocument = {
  schemaVersion: FLOW_SCHEMA_VERSION,
  nodes: [
    {
      id: 'n_trigger',
      key: 'incoming',
      label: 'Incoming message',
      position: at,
      type: NodeType.TriggerMessage,
      config: { channels: { mode: ChannelSelectionMode.All } },
    },
    {
      id: 'n_checks',
      key: 'checks',
      label: 'Checks',
      position: at,
      type: NodeType.Parallel,
      config: { waitFor: WaitFor.Guards },
    },
    {
      id: 'n_guard',
      key: 'guard',
      label: 'Guard',
      position: at,
      type: NodeType.Completion,
      config: {
        role: CompletionRole.Guard,
        prompt: examplePrompt('prm_guard'),
        model: exampleModel,
        input: { includeCurrentMessage: true },
        output: [
          {
            name: 'needs_human',
            type: OutputFieldType.Boolean,
            description: 'The customer asks for a person',
            required: true,
          },
          {
            name: 'reason',
            type: OutputFieldType.String,
            description: 'Why a person is needed',
            required: true,
          },
        ],
      },
    },
    {
      id: 'n_topic',
      key: 'topic',
      label: 'Topic',
      position: at,
      type: NodeType.Completion,
      config: {
        role: CompletionRole.Observer,
        prompt: examplePrompt('prm_topic'),
        model: exampleModel,
        input: { includeCurrentMessage: true },
        output: [
          {
            name: 'name',
            type: OutputFieldType.Enum,
            description: 'The topic of the message',
            required: true,
            values: ['pricing', 'booking', 'other'],
          },
        ],
      },
    },
    {
      id: 'n_route',
      key: 'route',
      label: 'Route',
      position: at,
      type: NodeType.Router,
      config: {
        rules: [
          {
            id: 'rule_human',
            label: 'Needs a human',
            match: RuleMatch.All,
            conditions: [
              { variable: 'guard.needs_human', operator: ConditionOperator.IsTrue, value: null },
            ],
          },
        ],
      },
    },
    {
      id: 'n_answer',
      key: 'answer',
      label: 'Answer',
      position: at,
      type: NodeType.Agent,
      config: {
        prompt: examplePrompt('prm_answer'),
        model: exampleModel,
        knowledgeBaseIds: ['kb_faq'],
        retrievalMode: RetrievalMode.Tools,
        output: [],
        retries: AGENT_DEFAULT_RETRIES,
      },
    },
    {
      id: 'n_reply',
      key: 'reply',
      label: 'Reply',
      position: at,
      type: NodeType.SendMessage,
      config: {
        content: { kind: MessageContentKind.List, variable: 'answer.messages' },
        typing: true,
        waitForDelivery: true,
        quickReplies: { kind: QuickRepliesKind.None },
      },
    },
    {
      id: 'n_handoff',
      key: 'handoff',
      label: 'Hand off',
      position: at,
      type: NodeType.Escalation,
      config: {
        mode: EscalationMode.Escalate,
        customerMessage: 'A person will answer you soon.',
        reason: '{{guard.reason}}',
        notify: {
          recipients: { kind: RecipientsKind.Role, role: WorkspaceRole.Operator },
          channels: [NotifyChannel.InPlatform, NotifyChannel.Telegram],
        },
        reminderAfterMinutes: ESCALATION_DEFAULT_REMINDER_MINUTES,
        fallbackAfterMinutes: ESCALATION_DEFAULT_FALLBACK_MINUTES,
        fallbackMessage: 'Sorry, nobody is available right now. We will write back soon.',
      },
    },
  ],
  edges: [
    { id: 'e1', source: 'n_trigger', sourcePort: PortName.Next, target: 'n_checks' },
    { id: 'e2', source: 'n_checks', sourcePort: PortName.Branches, target: 'n_guard' },
    { id: 'e3', source: 'n_checks', sourcePort: PortName.Branches, target: 'n_topic' },
    { id: 'e4', source: 'n_checks', sourcePort: PortName.Next, target: 'n_route' },
    { id: 'e5', source: 'n_route', sourcePort: 'rule_human', target: 'n_handoff' },
    { id: 'e6', source: 'n_route', sourcePort: PortName.Else, target: 'n_answer' },
    { id: 'e7', source: 'n_answer', sourcePort: PortName.Next, target: 'n_reply' },
    { id: 'e8', source: 'n_answer', sourcePort: PortName.Error, target: 'n_handoff' },
  ],
};

export const scheduledFollowUpFlow: FlowDocument = {
  schemaVersion: FLOW_SCHEMA_VERSION,
  nodes: [
    {
      id: 'n_schedule',
      key: 'every_morning',
      label: 'Every morning',
      position: at,
      type: NodeType.TriggerSchedule,
      config: {
        schedule: { kind: ScheduleKind.Daily, time: '10:00', timeZone: 'Europe/Kyiv' },
        conditions: {
          silentForHours: 24,
          notEscalated: true,
          channelTypes: [ChannelType.Telegram],
        },
        maxConversationsPerRun: 50,
        oncePerConversation: true,
      },
    },
    {
      id: 'n_follow_up',
      key: 'follow_up',
      label: 'Follow up',
      position: at,
      type: NodeType.Agent,
      config: {
        prompt: {
          promptId: 'prm_follow_up',
          version: { kind: PromptVersionKind.Pinned, number: 3 },
        },
        model: exampleModel,
        knowledgeBaseIds: [],
        retrievalMode: RetrievalMode.Tools,
        output: [
          {
            name: 'worth_sending',
            type: OutputFieldType.Boolean,
            description: 'A follow-up would help the customer',
            required: true,
          },
        ],
        retries: AGENT_DEFAULT_RETRIES,
      },
    },
    {
      id: 'n_decide',
      key: 'decide',
      label: 'Decide',
      position: at,
      type: NodeType.Router,
      config: {
        rules: [
          {
            id: 'rule_send',
            label: 'Send it',
            match: RuleMatch.All,
            conditions: [
              {
                variable: 'follow_up.worth_sending',
                operator: ConditionOperator.IsTrue,
                value: null,
              },
            ],
          },
        ],
      },
    },
    {
      id: 'n_send',
      key: 'send_follow_up',
      label: 'Send follow-up',
      position: at,
      type: NodeType.SendMessage,
      config: {
        content: { kind: MessageContentKind.List, variable: 'follow_up.messages' },
        typing: true,
        waitForDelivery: true,
        quickReplies: { kind: QuickRepliesKind.Static, buttons: ['Yes, please', 'No, thanks'] },
      },
    },
    {
      id: 'n_close',
      key: 'close',
      label: 'Close',
      position: at,
      type: NodeType.Escalation,
      config: { mode: EscalationMode.End, customerMessage: null },
    },
  ],
  edges: [
    { id: 'e1', source: 'n_schedule', sourcePort: PortName.Next, target: 'n_follow_up' },
    { id: 'e2', source: 'n_follow_up', sourcePort: PortName.Next, target: 'n_decide' },
    { id: 'e3', source: 'n_follow_up', sourcePort: PortName.Error, target: 'n_close' },
    { id: 'e4', source: 'n_decide', sourcePort: 'rule_send', target: 'n_send' },
    { id: 'e5', source: 'n_decide', sourcePort: PortName.Else, target: 'n_close' },
  ],
};

export const eventNotificationFlow: FlowDocument = {
  schemaVersion: FLOW_SCHEMA_VERSION,
  nodes: [
    {
      id: 'n_event',
      key: 'order_shipped',
      label: 'Order shipped',
      position: at,
      type: NodeType.TriggerExternalEvent,
      config: {
        eventName: 'order-shipped',
        channelId: 'chn_shop_api',
        examplePayload: { order: { id: 'A-100', tracking_url: 'https://track.example.com/A-100' } },
        replyMode: ReplyMode.DontWait,
      },
    },
    {
      id: 'n_load',
      key: 'load_order',
      label: 'Load the order',
      position: at,
      type: NodeType.ApiRequest,
      config: {
        method: HttpMethod.Get,
        url: 'https://shop.example.com/orders/{{event.order.id}}',
        headers: [{ name: 'Accept', value: 'application/json' }],
        body: { kind: RequestBodyKind.None },
        auth: { kind: RequestAuthKind.Bearer, credentialId: 'crd_shop' },
        timeoutSeconds: API_REQUEST_DEFAULT_TIMEOUT_SECONDS,
        retries: API_REQUEST_DEFAULT_RETRIES,
        onFailure: FailureMode.Continue,
      },
    },
    {
      id: 'n_notify',
      key: 'notify',
      label: 'Notify',
      position: at,
      type: NodeType.SendMessage,
      config: {
        content: {
          kind: MessageContentKind.Text,
          text: 'Your order {{event.order.id}} is on its way, arriving {{load_order.body.eta}}. Track it: {{event.order.tracking_url}}',
        },
        typing: false,
        waitForDelivery: true,
        quickReplies: { kind: QuickRepliesKind.None },
      },
    },
  ],
  edges: [
    { id: 'e1', source: 'n_event', sourcePort: PortName.Next, target: 'n_load' },
    { id: 'e2', source: 'n_load', sourcePort: PortName.Next, target: 'n_notify' },
  ],
};

export const exampleFlows: readonly FlowDocument[] = [
  faqWithHandOffFlow,
  scheduledFollowUpFlow,
  eventNotificationFlow,
];
