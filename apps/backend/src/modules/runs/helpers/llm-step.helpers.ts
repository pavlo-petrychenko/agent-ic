import { IdPrefix } from '@agent-ic/contracts';
import { ModelProviderKind, renderPrompt, resolvePath } from '@agent-ic/flow';
import type { ModelRef, PromptSource } from '@agent-ic/flow';
import { MessageAuthor } from '@/modules/conversations';
import type { Message } from '@/modules/conversations';
import type { ResolvedPrompts } from '@/modules/prompts';
import {
  ANSWER_FROM_CONVERSATION_MESSAGE,
  FOLLOW_UP_MESSAGE,
} from '@/modules/runs/constants/llm-step.constants';
import { RunTrigger } from '@/modules/runs/constants/run.constants';
import { StepModelUnknownError } from '@/modules/runs/errors/step-model-unknown.error';
import { StepPromptUnavailableError } from '@/modules/runs/errors/step-prompt-unavailable.error';
import { agentRunOf, transcriptsByRun } from '@/modules/runs/helpers/agent-transcript.helpers';
import { currentMessageStart } from '@/modules/runs/helpers/run-scope.helpers';
import type { StepTranscript } from '@/modules/runs/typedefs/agent-transcript.typedefs';
import type { StepData } from '@/modules/runs/typedefs/run-step.typedefs';
import type { IdService } from '@/platform/ids/services/id.service';
import { LLM_DEFAULT_MODEL } from '@/platform/llm/constants/llm-catalog.constants';
import { LlmMessageRole } from '@/platform/llm/constants/llm-gateway.constants';
import type { LlmPurpose } from '@/platform/llm/constants/llm-model.constants';
import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import { isTranscript } from '@/platform/llm/helpers/llm-gateway.helpers';
import { isLlmModelId } from '@/platform/llm/helpers/llm-model-profile.helpers';
import type {
  LlmAgentRequest,
  LlmCompleteRequest,
  LlmMessage,
  LlmTextMessage,
} from '@/platform/llm/typedefs/llm-gateway.typedefs';

export const stepModel = (
  nodeId: string,
  model: ModelRef | null,
  purpose: LlmPurpose,
  workspaceId: string,
  ids: IdService,
): Pick<LlmCompleteRequest<unknown>, 'provider' | 'model'> => {
  if (model === null) {
    return { provider: { kind: LlmProviderKind.Platform }, model: LLM_DEFAULT_MODEL[purpose] };
  }
  if (model.provider.kind === ModelProviderKind.Workspace) {
    return {
      provider: {
        kind: LlmProviderKind.Workspace,
        workspaceId,
        providerKeyId: ids.fromPublic(IdPrefix.LlmKey, model.provider.providerKeyId),
      },
      model: model.model,
    };
  }
  if (!isLlmModelId(model.model)) {
    throw new StepModelUnknownError(nodeId, model.model);
  }
  return { provider: { kind: LlmProviderKind.Platform }, model: model.model };
};

export const stepSystemPrompt = (
  nodeId: string,
  prompt: PromptSource | null,
  variables: StepData,
  prompts: ResolvedPrompts,
): string => {
  if (prompt === null) {
    throw new StepPromptUnavailableError(nodeId, null);
  }
  const resolved = prompts.get(nodeId) ?? null;
  if (resolved === null) {
    throw new StepPromptUnavailableError(nodeId, prompt.promptRef);
  }
  const bindings = new Map(
    Object.entries(prompt.bindings ?? {}).map(([name, target]) => [name.toLowerCase(), target]),
  );
  return renderPrompt(resolved.text, (path) => resolvePath(variables, bindings.get(path) ?? path));
};

const visibleHistory = (
  history: readonly Message[],
  includeCurrentMessage: boolean,
): readonly Message[] =>
  includeCurrentMessage ? history : history.slice(0, currentMessageStart(history));

const textMessage = ({ author, text }: Message): LlmTextMessage => ({
  role: author === MessageAuthor.Customer ? LlmMessageRole.User : LlmMessageRole.Assistant,
  content: text,
});

const systemNote = (trigger: RunTrigger, messages: readonly LlmMessage[]): string | null => {
  if (trigger !== RunTrigger.Message) {
    return FOLLOW_UP_MESSAGE;
  }
  const last = messages.at(-1);
  return last !== undefined && !isTranscript(last) && last.role === LlmMessageRole.User
    ? null
    : ANSWER_FROM_CONVERSATION_MESSAGE;
};

const withSystemNote = <M extends LlmMessage>(
  messages: readonly M[],
  trigger: RunTrigger,
): (M | LlmTextMessage)[] => {
  const note = systemNote(trigger, messages);
  return note === null
    ? [...messages]
    : [...messages, { role: LlmMessageRole.User, content: note }];
};

export const stepConversation = (
  system: string,
  history: readonly Message[],
  includeCurrentMessage: boolean,
  trigger: RunTrigger,
): Pick<LlmCompleteRequest<unknown>, 'system' | 'messages'> => ({
  system,
  messages: withSystemNote(
    visibleHistory(history, includeCurrentMessage).map(textMessage),
    trigger,
  ),
});

export const agentHistory = (
  history: readonly Message[],
  steps: readonly StepTranscript[],
  nodeId: string,
): LlmMessage[] => {
  const transcripts = transcriptsByRun(steps, nodeId);
  const replayed = new Set<string>();
  return history.flatMap((message): LlmMessage[] => {
    const run = agentRunOf(message, transcripts);
    if (run === null || message.runId === null) {
      return [textMessage(message)];
    }
    const first = !replayed.has(message.runId);
    replayed.add(message.runId);
    return [
      ...(first ? [{ transcript: run.transcript }] : []),
      ...(run.sentTexts.has(message.text) ? [] : [textMessage(message)]),
    ];
  });
};

export const agentConversation = (
  system: string,
  history: readonly Message[],
  includeCurrentMessage: boolean,
  trigger: RunTrigger,
  steps: readonly StepTranscript[],
  nodeId: string,
): Pick<LlmAgentRequest<unknown>, 'system' | 'messages'> => ({
  system,
  messages: withSystemNote(
    agentHistory(visibleHistory(history, includeCurrentMessage), steps, nodeId),
    trigger,
  ),
});
