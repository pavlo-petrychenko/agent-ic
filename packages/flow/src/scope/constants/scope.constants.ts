import { NodeType } from '@flow/document/constants/flow.constants';
import { OutputFieldType } from '@flow/outputs/constants/output.constants';
import type { TriggerVariable } from '@flow/scope/typedefs/scope.typedefs';

export enum VariableType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Enum = 'enum',
  StringList = 'string_list',
  List = 'list',
  Unknown = 'unknown',
}

export enum VariableSourceKind {
  Trigger = 'trigger',
  Step = 'step',
  System = 'system',
}

export enum Presence {
  Guaranteed = 'guaranteed',
  Possible = 'possible',
}

export const EVENT_ROOT = 'event';
export const TODAY_VARIABLE = 'today';

const variable = (path: string, type: VariableType, open = false): TriggerVariable => ({
  path,
  type,
  open,
});

const USER_VARIABLES: readonly TriggerVariable[] = [
  variable('user.name', VariableType.String),
  variable('user.language', VariableType.String),
];

const CHANNEL_VARIABLE = variable('channel', VariableType.String);
const HISTORY_VARIABLE = variable('history', VariableType.List);

export const TRIGGER_VARIABLES: Readonly<
  Record<
    NodeType.TriggerMessage | NodeType.TriggerExternalEvent | NodeType.TriggerSchedule,
    readonly TriggerVariable[]
  >
> = {
  [NodeType.TriggerMessage]: [
    variable('message.text', VariableType.String),
    variable('message.attachments', VariableType.List),
    ...USER_VARIABLES,
    CHANNEL_VARIABLE,
    HISTORY_VARIABLE,
  ],
  [NodeType.TriggerExternalEvent]: [
    variable(EVENT_ROOT, VariableType.Unknown, true),
    variable('user_id', VariableType.String),
    CHANNEL_VARIABLE,
  ],
  [NodeType.TriggerSchedule]: [
    variable('conversation.id', VariableType.String),
    variable('conversation.started_at', VariableType.String),
    variable('conversation.last_message_at', VariableType.String),
    ...USER_VARIABLES,
    CHANNEL_VARIABLE,
    HISTORY_VARIABLE,
  ],
};

export const RESERVED_ROOTS: readonly string[] = [
  'message',
  'user',
  'channel',
  'history',
  EVENT_ROOT,
  'user_id',
  'conversation',
  TODAY_VARIABLE,
];

export const OUTPUT_VARIABLE_TYPES: Readonly<Record<OutputFieldType, VariableType>> = {
  [OutputFieldType.String]: VariableType.String,
  [OutputFieldType.Number]: VariableType.Number,
  [OutputFieldType.Boolean]: VariableType.Boolean,
  [OutputFieldType.Enum]: VariableType.Enum,
  [OutputFieldType.StringList]: VariableType.StringList,
};

export const API_REQUEST_OUTPUTS: readonly TriggerVariable[] = [
  variable('ok', VariableType.Boolean),
  variable('status', VariableType.Number),
  variable('body', VariableType.Unknown, true),
];

export const API_REQUEST_ALWAYS_SET_OUTPUT = 'ok';
