import { NodeType } from '@agent-ic/flow';
import type { DescribedNodeType } from '@/features/flow-builder/typedefs/inspector.typedefs';

export const DESCRIBED_NODE_TYPES: readonly DescribedNodeType[] = [
  NodeType.TriggerMessage,
  NodeType.Router,
  NodeType.Parallel,
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

export const KEY_INVALID_CHARACTERS = /[^a-z0-9]+/g;
export const KEY_EDGE_SEPARATORS = /^_+|_+$/g;
