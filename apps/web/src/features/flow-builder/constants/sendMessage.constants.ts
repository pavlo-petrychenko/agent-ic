import { MessageContentKind, QuickRepliesKind, VariableType } from '@agent-ic/flow';

export const MESSAGE_LIST_TYPES: readonly VariableType[] = [
  VariableType.StringList,
  VariableType.Unknown,
];

export const MESSAGE_CONTENT_KINDS: readonly MessageContentKind[] = [
  MessageContentKind.List,
  MessageContentKind.Text,
];

export const BUTTON_SOURCES: readonly QuickRepliesKind[] = [
  QuickRepliesKind.None,
  QuickRepliesKind.Static,
  QuickRepliesKind.Variable,
];
