import { NodeType, OperandKind, WaitFor } from '@agent-ic/flow';
import type { DescribedNodeType } from '@/features/flow-builder/typedefs/inspector.typedefs';
import { BadgeTone } from '@/shared/ui/display/Badge/Badge.constants';

export const DESCRIBED_NODE_TYPES: readonly DescribedNodeType[] = [
  NodeType.TriggerMessage,
  NodeType.Agent,
  NodeType.Completion,
  NodeType.Router,
  NodeType.Parallel,
  NodeType.SendMessage,
  NodeType.Escalation,
  NodeType.ApiRequest,
];

export enum FieldHint {
  FromChannel = 'fromChannel',
  ChannelKinds = 'channelKinds',
  WholeConversation = 'wholeConversation',
}

export const FIELD_HINTS: Readonly<Record<string, FieldHint>> = {
  'user.name': FieldHint.FromChannel,
  'user.language': FieldHint.FromChannel,
  channel: FieldHint.ChannelKinds,
  history: FieldHint.WholeConversation,
};

export const ENUM_VALUES_SEPARATOR = ' | ';

export enum MessageTreatment {
  Runs = 'runs',
  Attachments = 'attachments',
  Ignored = 'ignored',
}

export enum MessageType {
  Text = 'text',
  Files = 'files',
  Voice = 'voice',
}

export const MESSAGE_TYPES: Readonly<Record<MessageType, MessageTreatment>> = {
  [MessageType.Text]: MessageTreatment.Runs,
  [MessageType.Files]: MessageTreatment.Attachments,
  [MessageType.Voice]: MessageTreatment.Ignored,
};

export const WAIT_FOR_OPTIONS: readonly WaitFor[] = [WaitFor.All, WaitFor.First];

export enum BranchRole {
  Waited = 'waited',
  Background = 'background',
  Racing = 'racing',
}

export const BRANCH_ROLE_TONES: Readonly<Record<BranchRole, BadgeTone>> = {
  [BranchRole.Waited]: BadgeTone.Accent,
  [BranchRole.Background]: BadgeTone.Neutral,
  [BranchRole.Racing]: BadgeTone.Warn,
};

export const LIST_VALUE_SEPARATOR = ',';
export const LIST_VALUE_JOINER = ', ';

export enum ValueInput {
  None = 'none',
  Text = 'text',
  Number = 'number',
  Choice = 'choice',
  List = 'list',
}

export const OPERAND_INPUTS: Readonly<Record<OperandKind, ValueInput>> = {
  [OperandKind.None]: ValueInput.None,
  [OperandKind.Scalar]: ValueInput.Text,
  [OperandKind.Text]: ValueInput.Text,
  [OperandKind.Number]: ValueInput.Number,
  [OperandKind.TextList]: ValueInput.List,
};

export const MOVE_UP = -1;
export const MOVE_DOWN = 1;

export const INPUT_DEFAULTS: Readonly<Record<ValueInput, string | number | string[] | null>> = {
  [ValueInput.None]: null,
  [ValueInput.Text]: '',
  [ValueInput.Number]: 0,
  [ValueInput.Choice]: '',
  [ValueInput.List]: [],
};

export const KEY_INVALID_CHARACTERS = /[^a-z0-9]+/g;
export const KEY_EDGE_SEPARATORS = /^_+|_+$/g;
export const PATH_JOINER = '.';

export enum IssuePathSegment {
  Rules = 'rules',
  Conditions = 'conditions',
  Id = 'id',
  Variable = 'variable',
  Operator = 'operator',
  Value = 'value',
  Prompt = 'prompt',
  Text = 'text',
  Model = 'model',
  Output = 'output',
  Name = 'name',
  Content = 'content',
  QuickReplies = 'quickReplies',
  CustomerMessage = 'customerMessage',
  Reason = 'reason',
  FallbackMessage = 'fallbackMessage',
  Reminder = 'reminderAfterMinutes',
  Fallback = 'fallbackAfterMinutes',
  Url = 'url',
  Headers = 'headers',
  Body = 'body',
  OnFailure = 'onFailure',
}

export enum InputType {
  Text = 'text',
  Number = 'number',
}
