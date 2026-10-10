import {
  AGENT_DEFAULT_RETRIES,
  API_REQUEST_DEFAULT_RETRIES,
  API_REQUEST_DEFAULT_TIMEOUT_SECONDS,
  ChannelSelectionMode,
  CompletionRole,
  DEFAULT_RETRIEVAL_MODE,
  ESCALATION_DEFAULT_FALLBACK_MINUTES,
  ESCALATION_DEFAULT_REMINDER_MINUTES,
  EscalationMode,
  FailureMode,
  HttpMethod,
  MessageContentKind,
  NodeType,
  NotifyChannel,
  OutputFieldType,
  PromptSourceKind,
  QuickRepliesKind,
  RecipientsKind,
  RequestAuthKind,
  RequestBodyKind,
  WaitFor,
} from '@agent-ic/flow';
import type { NodeTemplates } from '@/features/flow-builder/typedefs/graphEdit.typedefs';

export const COMPLETION_DEFAULT_OUTPUT_NAME = 'result';

export const NODE_TEMPLATES: NodeTemplates = {
  [NodeType.TriggerMessage]: {
    type: NodeType.TriggerMessage,
    config: { channels: { mode: ChannelSelectionMode.All } },
  },
  [NodeType.Agent]: {
    type: NodeType.Agent,
    config: {
      prompt: { kind: PromptSourceKind.Inline, text: '' },
      model: null,
      reasoning: null,
      knowledgeBaseIds: [],
      retrievalMode: DEFAULT_RETRIEVAL_MODE,
      output: [],
      retries: AGENT_DEFAULT_RETRIES,
    },
  },
  [NodeType.Completion]: {
    type: NodeType.Completion,
    config: {
      role: CompletionRole.Guard,
      prompt: { kind: PromptSourceKind.Inline, text: '' },
      model: null,
      reasoning: null,
      input: { includeCurrentMessage: true },
      output: [
        {
          name: COMPLETION_DEFAULT_OUTPUT_NAME,
          type: OutputFieldType.String,
          description: '',
          required: true,
        },
      ],
    },
  },
  [NodeType.Router]: { type: NodeType.Router, config: { rules: [] } },
  [NodeType.Parallel]: { type: NodeType.Parallel, config: { waitFor: WaitFor.Guards } },
  [NodeType.ApiRequest]: {
    type: NodeType.ApiRequest,
    config: {
      method: HttpMethod.Get,
      url: '',
      headers: [],
      body: { kind: RequestBodyKind.None },
      auth: { kind: RequestAuthKind.None },
      timeoutSeconds: API_REQUEST_DEFAULT_TIMEOUT_SECONDS,
      retries: API_REQUEST_DEFAULT_RETRIES,
      onFailure: FailureMode.Continue,
    },
  },
  [NodeType.SendMessage]: {
    type: NodeType.SendMessage,
    config: {
      content: { kind: MessageContentKind.Text, text: '' },
      typing: true,
      waitForDelivery: false,
      quickReplies: { kind: QuickRepliesKind.None },
    },
  },
  [NodeType.Escalation]: {
    type: NodeType.Escalation,
    config: {
      mode: EscalationMode.Escalate,
      customerMessage: null,
      reason: '',
      notify: {
        recipients: { kind: RecipientsKind.Operators },
        channels: [NotifyChannel.InPlatform],
      },
      reminderAfterMinutes: ESCALATION_DEFAULT_REMINDER_MINUTES,
      fallbackAfterMinutes: ESCALATION_DEFAULT_FALLBACK_MINUTES,
      fallbackMessage: '',
    },
  },
};
