import { MessageContentKind, QuickRepliesKind, renderTemplate, resolvePath } from '@agent-ic/flow';
import type { SendMessageNode } from '@agent-ic/flow';
import { MessageAuthor } from '@/modules/conversations';
import type { OutboundMessageInput } from '@/modules/conversations';
import {
  OUTBOUND_KEY_NODE,
  OUTBOUND_KEY_RUN,
  OUTBOUND_KEY_SEPARATOR,
} from '@/modules/runs/constants/outbound-message.constants';
import type { StepData } from '@/modules/runs/typedefs/run-step.typedefs';
import type { Run } from '@/modules/runs/typedefs/run.typedefs';

type SendMessageConfig = SendMessageNode['config'];

const textsOf = (value: unknown): string[] => {
  if (typeof value === 'string') {
    return [value];
  }
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
};

const withoutBlanks = (texts: readonly string[]): string[] =>
  texts.filter((text) => text.trim().length > 0);

export const listTexts = (value: unknown): string[] => withoutBlanks(textsOf(value));

export const renderStepText = (template: string, variables: StepData): string =>
  renderTemplate(template, (path) => resolvePath(variables, path));

export const templateTexts = (template: string | null, variables: StepData): string[] =>
  template === null ? [] : withoutBlanks([renderStepText(template, variables)]);

export const messageTexts = (
  content: SendMessageConfig['content'],
  variables: StepData,
): string[] =>
  content.kind === MessageContentKind.Text
    ? templateTexts(content.text, variables)
    : withoutBlanks(textsOf(resolvePath(variables, content.variable)));

export const quickReplyLabels = (
  quickReplies: SendMessageConfig['quickReplies'],
  variables: StepData,
): string[] => {
  switch (quickReplies.kind) {
    case QuickRepliesKind.None:
      return [];
    case QuickRepliesKind.Static:
      return [...quickReplies.buttons];
    case QuickRepliesKind.Variable:
      return withoutBlanks(textsOf(resolvePath(variables, quickReplies.variable)));
  }
};

export const outboundMessageKey = (runId: string, nodeId: string, index: number): string =>
  [OUTBOUND_KEY_RUN, runId, OUTBOUND_KEY_NODE, nodeId, index].join(OUTBOUND_KEY_SEPARATOR);

export const outboundMessages = (
  run: Run,
  nodeId: string,
  texts: readonly string[],
  quickReplies: readonly string[] = [],
): OutboundMessageInput[] =>
  texts.map((text, index) => ({
    workspaceId: run.workspaceId,
    conversationId: run.conversationId,
    key: outboundMessageKey(run.id, nodeId, index),
    author: MessageAuthor.Agent,
    text,
    quickReplies: index === texts.length - 1 ? quickReplies : [],
    runId: run.id,
  }));
