import { IdPrefix } from '@agent-ic/contracts';
import { ModelProviderKind, renderTemplate, resolvePath } from '@agent-ic/flow';
import type { ModelRef, PromptSource } from '@agent-ic/flow';
import { MessageAuthor } from '@/modules/conversations';
import type { Message } from '@/modules/conversations';
import type { ResolvedPrompts } from '@/modules/prompts';
import { ANSWER_FROM_CONVERSATION_MESSAGE } from '@/modules/runs/constants/llm-step.constants';
import { StepModelUnknownError } from '@/modules/runs/errors/step-model-unknown.error';
import { StepPromptUnavailableError } from '@/modules/runs/errors/step-prompt-unavailable.error';
import { currentMessageStart } from '@/modules/runs/helpers/run-scope.helpers';
import type { StepData } from '@/modules/runs/typedefs/run-step.typedefs';
import type { IdService } from '@/platform/ids/services/id.service';
import { LLM_DEFAULT_MODEL } from '@/platform/llm/constants/llm-catalog.constants';
import { LlmMessageRole } from '@/platform/llm/constants/llm-gateway.constants';
import type { LlmPurpose } from '@/platform/llm/constants/llm-model.constants';
import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import { isLlmModelId } from '@/platform/llm/helpers/llm-model-profile.helpers';
import type { LlmCompleteRequest, LlmMessage } from '@/platform/llm/typedefs/llm-gateway.typedefs';

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
  return renderTemplate(resolved.text, (path) => resolvePath(variables, path));
};

const historyMessages = (
  history: readonly Message[],
  includeCurrentMessage: boolean,
): LlmMessage[] =>
  (includeCurrentMessage ? history : history.slice(0, currentMessageStart(history))).map(
    ({ author, text }) => ({
      role: author === MessageAuthor.Customer ? LlmMessageRole.User : LlmMessageRole.Assistant,
      content: text,
    }),
  );

export const stepConversation = (
  system: string,
  history: readonly Message[],
  includeCurrentMessage: boolean,
): Pick<LlmCompleteRequest<unknown>, 'system' | 'messages'> => {
  const messages = historyMessages(history, includeCurrentMessage);
  return {
    system,
    messages:
      messages.at(-1)?.role === LlmMessageRole.User
        ? messages
        : [...messages, { role: LlmMessageRole.User, content: ANSWER_FROM_CONVERSATION_MESSAGE }],
  };
};
