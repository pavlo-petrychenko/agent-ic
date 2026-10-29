import { IdPrefix } from '@agent-ic/contracts';
import { ModelProviderKind } from '@agent-ic/flow';
import type { ModelRef } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { MessageAuthor } from '@/modules/conversations';
import {
  ANSWER_FROM_CONVERSATION_MESSAGE,
  FOLLOW_UP_MESSAGE,
} from '@/modules/runs/constants/llm-step.constants';
import { RunTrigger } from '@/modules/runs/constants/run.constants';
import { StepModelUnknownError } from '@/modules/runs/errors/step-model-unknown.error';
import { stepConversation, stepModel } from '@/modules/runs/helpers/llm-step.helpers';
import { InvalidIdError } from '@/platform/ids/errors/invalid-id.error';
import { IdService } from '@/platform/ids/services/id.service';
import { LLM_DEFAULT_MODEL } from '@/platform/llm/constants/llm-catalog.constants';
import { LlmMessageRole } from '@/platform/llm/constants/llm-gateway.constants';
import { LlmModelId, LlmPurpose } from '@/platform/llm/constants/llm-model.constants';
import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import { RUNS_TEST_START } from '@test/support/constants/runs-testing.constants';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import { historyMessage, runConversation } from '@test/support/fixtures/runs.fixture';

const NODE_ID = 'node-agent';
const WORKSPACE_ID = 'workspace-step-model';
const KEY_MODEL = 'house-model-unknown-to-the-catalog';
const PURPOSE = LlmPurpose.Conversation;
const SYSTEM = 'You are a helpful shop assistant.';
const QUESTION = 'Do you deliver?';
const ANSWER = 'Yes, every day.';

describe('stepModel', () => {
  const ids = new IdService(new ManualClock(RUNS_TEST_START));

  it('runs a step without a model on the platform default', () => {
    expect(stepModel(NODE_ID, null, PURPOSE, WORKSPACE_ID, ids)).toEqual({
      provider: { kind: LlmProviderKind.Platform },
      model: LLM_DEFAULT_MODEL[PURPOSE],
    });
  });

  it('runs a platform model from the catalog', () => {
    const model: ModelRef = {
      provider: { kind: ModelProviderKind.Platform },
      model: LlmModelId.Gemma4,
    };

    expect(stepModel(NODE_ID, model, PURPOSE, WORKSPACE_ID, ids)).toEqual({
      provider: { kind: LlmProviderKind.Platform },
      model: LlmModelId.Gemma4,
    });
  });

  it('refuses a platform model that is not in the catalog', () => {
    const model: ModelRef = { provider: { kind: ModelProviderKind.Platform }, model: KEY_MODEL };

    expect(() => stepModel(NODE_ID, model, PURPOSE, WORKSPACE_ID, ids)).toThrow(
      StepModelUnknownError,
    );
  });

  it('runs any model id on a workspace key and passes the key by its internal id', () => {
    const keyId = ids.generate();
    const model: ModelRef = {
      provider: {
        kind: ModelProviderKind.Workspace,
        providerKeyId: ids.toPublic(IdPrefix.LlmKey, keyId),
      },
      model: KEY_MODEL,
    };

    expect(stepModel(NODE_ID, model, PURPOSE, WORKSPACE_ID, ids)).toEqual({
      provider: {
        kind: LlmProviderKind.Workspace,
        workspaceId: WORKSPACE_ID,
        providerKeyId: keyId,
      },
      model: KEY_MODEL,
    });
  });

  it('refuses a workspace key id of another kind', () => {
    const model: ModelRef = {
      provider: {
        kind: ModelProviderKind.Workspace,
        providerKeyId: ids.toPublic(IdPrefix.Prompt, ids.generate()),
      },
      model: KEY_MODEL,
    };

    expect(() => stepModel(NODE_ID, model, PURPOSE, WORKSPACE_ID, ids)).toThrow(InvalidIdError);
  });
});

describe('stepConversation', () => {
  const conversation = runConversation(new IdService(new ManualClock(RUNS_TEST_START)));
  const question = historyMessage(conversation, MessageAuthor.Customer, QUESTION);
  const answer = historyMessage(conversation, MessageAuthor.Agent, ANSWER);
  const asked = { role: LlmMessageRole.User, content: QUESTION };
  const answered = { role: LlmMessageRole.Assistant, content: ANSWER };

  it('ends a message run on the customer message without a note', () => {
    expect(stepConversation(SYSTEM, [question], true, RunTrigger.Message)).toEqual({
      system: SYSTEM,
      messages: [asked],
    });
  });

  it('asks a message run to answer from the conversation when it ends on the agent', () => {
    expect(stepConversation(SYSTEM, [question, answer], true, RunTrigger.Message).messages).toEqual(
      [asked, answered, { role: LlmMessageRole.User, content: ANSWER_FROM_CONVERSATION_MESSAGE }],
    );
  });

  it.each([RunTrigger.Schedule, RunTrigger.Inactivity])(
    'asks a %s run for a follow-up, as there is no new customer message',
    (trigger) => {
      const followUp = { role: LlmMessageRole.User, content: FOLLOW_UP_MESSAGE };

      expect(stepConversation(SYSTEM, [question, answer], true, trigger).messages).toEqual([
        asked,
        answered,
        followUp,
      ]);
      expect(stepConversation(SYSTEM, [question], true, trigger).messages).toEqual([
        asked,
        followUp,
      ]);
    },
  );
});
