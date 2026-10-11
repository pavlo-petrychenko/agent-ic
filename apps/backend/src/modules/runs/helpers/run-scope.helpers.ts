import { VariableSourceKind } from '@agent-ic/flow';
import { MessageAuthor } from '@/modules/conversations';
import type { Conversation, Message } from '@/modules/conversations';
import { CURRENT_MESSAGE_SEPARATOR, ISO_DATE_LENGTH } from '@/modules/runs/constants/run.constants';
import type {
  MessageTriggerVariables,
  RunWalk,
} from '@/modules/runs/typedefs/run-execution.typedefs';
import type { StepData } from '@/modules/runs/typedefs/run-step.typedefs';

export const currentMessageText = (history: readonly Message[]): string => {
  const lastOther = history.findLastIndex((message) => message.author !== MessageAuthor.Customer);
  return history
    .slice(lastOther + 1)
    .map((message) => message.text)
    .join(CURRENT_MESSAGE_SEPARATOR);
};

export const messageTriggerVariables = (
  conversation: Conversation,
  history: readonly Message[],
  today: Date,
): MessageTriggerVariables => ({
  message: { text: currentMessageText(history), attachments: [] },
  user: { name: conversation.endUserName, language: null },
  channel: conversation.channelKind,
  history: history.map(({ author, text }) => ({ author, text })),
  today: today.toISOString().slice(0, ISO_DATE_LENGTH),
});

export const stepVariables = (
  walk: Pick<RunWalk, 'flow' | 'lookup' | 'trigger' | 'steps'>,
  nodeId: string,
): StepData => {
  const visible = new Set(
    walk
      .lookup(nodeId)
      .filter((variable) => variable.source === VariableSourceKind.Step)
      .map((variable) => variable.nodeId),
  );
  const outputs = walk.flow.nodes.flatMap((node) => {
    const output = walk.steps.get(node.id)?.output ?? null;
    return visible.has(node.id) && output !== null ? [[node.key, output] as const] : [];
  });
  return { ...walk.trigger, ...Object.fromEntries(outputs) };
};

export const stepInput = ({ history: _history, ...input }: StepData): StepData => input;
