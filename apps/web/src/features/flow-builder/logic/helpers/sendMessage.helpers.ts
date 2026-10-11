import { MessageContentKind, NodeType, QuickRepliesKind } from '@agent-ic/flow';
import type { FlowDocument, SendMessageNode, VisibleVariable } from '@agent-ic/flow';
import { MESSAGE_LIST_TYPES } from '@/features/flow-builder/constants/sendMessage.constants';
import { updateNode } from '@/features/flow-builder/logic/helpers/inspector.helpers';

type SendMessageConfig = SendMessageNode['config'];

export const listVariables = (variables: readonly VisibleVariable[]): string[] =>
  variables
    .filter((variable) => MESSAGE_LIST_TYPES.includes(variable.type))
    .map(({ path }) => path);

export const updateSendMessage = (
  document: FlowDocument,
  nodeId: string,
  patch: Partial<SendMessageConfig>,
): FlowDocument =>
  updateNode(document, nodeId, (node) =>
    node.type === NodeType.SendMessage ? { ...node, config: { ...node.config, ...patch } } : node,
  );

export const contentOfKind = (
  kind: MessageContentKind,
  lists: readonly string[],
): SendMessageConfig['content'] =>
  kind === MessageContentKind.List
    ? { kind, variable: lists[0] ?? '' }
    : { kind: MessageContentKind.Text, text: '' };

export const quickRepliesOfKind = (
  kind: QuickRepliesKind,
  lists: readonly string[],
  firstButton: string,
): SendMessageConfig['quickReplies'] => {
  switch (kind) {
    case QuickRepliesKind.Static:
      return { kind, buttons: [firstButton] };
    case QuickRepliesKind.Variable:
      return { kind, variable: lists[0] ?? '' };
    case QuickRepliesKind.None:
      return { kind };
  }
};

export const replaceButton = (
  buttons: readonly string[],
  index: number,
  label: string | null,
): string[] =>
  label === null
    ? buttons.filter((_, position) => position !== index)
    : [...buttons.slice(0, index), label, ...buttons.slice(index + 1)];
