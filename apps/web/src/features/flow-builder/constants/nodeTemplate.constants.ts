import {
  AGENT_DEFAULT_RETRIES,
  API_REQUEST_DEFAULT_RETRIES,
  API_REQUEST_DEFAULT_TIMEOUT_SECONDS,
  ChannelSelectionMode,
  InactivityActivity,
  InactivityRepeatKind,
  DEFAULT_RETRIEVAL_MODE,
  ESCALATION_DEFAULT_FALLBACK_MINUTES,
  ESCALATION_DEFAULT_REMINDER_MINUTES,
  EscalationMode,
  FailureMode,
  HttpMethod,
  MessageContentKind,
  NO_AGENT_EXITS,
  NodeType,
  NotifyChannel,
  OutputFieldType,
  QuickRepliesKind,
  RecipientsKind,
  RequestAuthKind,
  RequestBodyKind,
  ScheduleKind,
  WaitFor,
} from '@agent-ic/flow';
import type { HandoffSettings } from '@agent-ic/flow';
import {
  INACTIVITY_CHANNEL_TYPES,
  INACTIVITY_DEFAULT_SILENCE,
} from '@/features/flow-builder/constants/inactivity.constants';
import {
  SCHEDULE_CHANNEL_TYPES,
  SCHEDULE_DEFAULT_MAX_CONVERSATIONS,
  SCHEDULE_DEFAULT_SILENT_HOURS,
  SCHEDULE_DEFAULT_TIME,
} from '@/features/flow-builder/constants/schedule.constants';
import type { NodeTemplates } from '@/features/flow-builder/typedefs/graphEdit.typedefs';
import { UTC_TIME_ZONE } from '@/shared/forms/constants/timeZone.constants';

export const COMPLETION_DEFAULT_OUTPUT_NAME = 'result';

export const DEFAULT_HANDOFF: HandoffSettings = {
  notify: {
    recipients: { kind: RecipientsKind.Operators },
    channels: [NotifyChannel.InPlatform],
  },
  reminderAfterMinutes: ESCALATION_DEFAULT_REMINDER_MINUTES,
  fallbackAfterMinutes: ESCALATION_DEFAULT_FALLBACK_MINUTES,
  fallbackMessage: '',
};

export const NODE_TEMPLATES: NodeTemplates = {
  [NodeType.TriggerMessage]: {
    type: NodeType.TriggerMessage,
    config: { channels: { mode: ChannelSelectionMode.All } },
  },
  [NodeType.TriggerSchedule]: {
    type: NodeType.TriggerSchedule,
    config: {
      schedule: {
        kind: ScheduleKind.Daily,
        time: SCHEDULE_DEFAULT_TIME,
        timeZone: UTC_TIME_ZONE,
      },
      conditions: {
        silentForHours: SCHEDULE_DEFAULT_SILENT_HOURS,
        notEscalated: true,
        channelTypes: [...SCHEDULE_CHANNEL_TYPES],
      },
      maxConversationsPerRun: SCHEDULE_DEFAULT_MAX_CONVERSATIONS,
      oncePerConversation: true,
    },
  },
  [NodeType.TriggerInactivity]: {
    type: NodeType.TriggerInactivity,
    config: {
      silence: { ...INACTIVITY_DEFAULT_SILENCE },
      activity: InactivityActivity.Any,
      repeat: { kind: InactivityRepeatKind.Once },
      conditions: { notEscalated: true, channelTypes: [...INACTIVITY_CHANNEL_TYPES] },
    },
  },
  [NodeType.Agent]: {
    type: NodeType.Agent,
    config: {
      prompt: null,
      model: null,
      reasoning: null,
      knowledgeBaseIds: [],
      retrievalMode: DEFAULT_RETRIEVAL_MODE,
      output: [],
      retries: AGENT_DEFAULT_RETRIES,
      exits: NO_AGENT_EXITS,
    },
  },
  [NodeType.Completion]: {
    type: NodeType.Completion,
    config: {
      prompt: null,
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
  [NodeType.Parallel]: { type: NodeType.Parallel, config: { waitFor: WaitFor.All } },
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
      ...DEFAULT_HANDOFF,
    },
  },
};
