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
import {
  agentConversation,
  stepConversation,
  stepModel,
} from '@/modules/runs/helpers/llm-step.helpers';
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

describe('agentConversation', () => {
  const conversation = runConversation(new IdService(new ManualClock(RUNS_TEST_START)));
  const AGENT_NODE = 'node-agent';
  const OTHER_NODE = 'node-other';
  const FIRST_RUN = 'run-first';
  const SECOND_RUN = 'run-second';
  const FOLLOW_UP = 'And on Mondays?';
  const GREETING = 'Hello from the flow.';
  const SECOND_ANSWER = 'Mondays too.';
  const firstTranscript = [
    { role: 'assistant' as const, content: JSON.stringify({ messages: [ANSWER] }) },
  ];
  const otherTranscript = [{ role: 'assistant' as const, content: 'Other agent.' }];
  const fromRun = (author: MessageAuthor, text: string, runId: string | null) => ({
    ...historyMessage(conversation, author, text),
    runId,
  });
  const question = fromRun(MessageAuthor.Customer, QUESTION, null);
  const greeting = fromRun(MessageAuthor.Agent, GREETING, FIRST_RUN);
  const answer = fromRun(MessageAuthor.Agent, ANSWER, FIRST_RUN);
  const followUp = fromRun(MessageAuthor.Customer, FOLLOW_UP, null);
  const secondAnswer = fromRun(MessageAuthor.Agent, SECOND_ANSWER, SECOND_RUN);
  const steps = [
    {
      runId: FIRST_RUN,
      nodeId: AGENT_NODE,
      transcript: firstTranscript,
      output: { messages: [ANSWER] },
    },
    { runId: FIRST_RUN, nodeId: OTHER_NODE, transcript: otherTranscript, output: null },
  ];

  it('puts the transcript of the node in place of the messages it sent, at the first message of its run', () => {
    expect(
      agentConversation(
        SYSTEM,
        [question, greeting, answer, followUp, secondAnswer, followUp],
        true,
        RunTrigger.Message,
        steps,
        AGENT_NODE,
      ).messages,
    ).toEqual([
      { role: LlmMessageRole.User, content: QUESTION },
      { transcript: firstTranscript },
      { role: LlmMessageRole.Assistant, content: GREETING },
      { role: LlmMessageRole.User, content: FOLLOW_UP },
      { role: LlmMessageRole.Assistant, content: SECOND_ANSWER },
      { role: LlmMessageRole.User, content: FOLLOW_UP },
    ]);
  });

  it('keeps plain texts when the node has no transcript', () => {
    expect(
      agentConversation(
        SYSTEM,
        [question, answer, followUp],
        true,
        RunTrigger.Message,
        [],
        AGENT_NODE,
      ).messages,
    ).toEqual([
      { role: LlmMessageRole.User, content: QUESTION },
      { role: LlmMessageRole.Assistant, content: ANSWER },
      { role: LlmMessageRole.User, content: FOLLOW_UP },
    ]);
  });

  it('asks to answer from the conversation when the history ends on a transcript', () => {
    expect(
      agentConversation(SYSTEM, [question, answer], true, RunTrigger.Message, steps, AGENT_NODE)
        .messages,
    ).toEqual([
      { role: LlmMessageRole.User, content: QUESTION },
      { transcript: firstTranscript },
      { role: LlmMessageRole.User, content: ANSWER_FROM_CONVERSATION_MESSAGE },
    ]);
  });
});
