import { PortName, createScopeLookup } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { ChannelKind, MessageAuthor } from '@/modules/conversations';
import { CURRENT_MESSAGE_SEPARATOR, RunStepStatus } from '@/modules/runs/constants/run.constants';
import {
  messageTriggerVariables,
  stepInput,
  stepVariables,
} from '@/modules/runs/helpers/run-scope.helpers';
import { IdService } from '@/platform/ids/services/id.service';
import { TEST_NODE_ID } from '@test/support/constants/agents-testing.constants';
import { TEST_MESSAGE_TEXT } from '@test/support/constants/conversations-testing.constants';
import {
  FIRST_STEP_ID,
  FIRST_STEP_KEY,
  RUNS_TEST_START,
  SECOND_STEP_ID,
  SECOND_STEP_KEY,
  TEST_AGENT_REPLY,
  TEST_END_USER_NAME,
  TEST_FOLLOW_UP,
  TEST_TODAY,
} from '@test/support/constants/runs-testing.constants';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import {
  agentNode,
  finishedStep,
  flowEdge,
  historyMessage,
  runConversation,
  stepFlow,
} from '@test/support/fixtures/runs.fixture';

const ids = new IdService(new ManualClock(RUNS_TEST_START));
const conversation = runConversation(ids);
const history = [
  historyMessage(conversation, MessageAuthor.Customer, TEST_MESSAGE_TEXT),
  historyMessage(conversation, MessageAuthor.Agent, TEST_AGENT_REPLY),
  historyMessage(conversation, MessageAuthor.Customer, TEST_FOLLOW_UP),
  historyMessage(conversation, MessageAuthor.Customer, TEST_MESSAGE_TEXT),
];
const trigger = messageTriggerVariables(conversation, history, RUNS_TEST_START);
const first = agentNode(FIRST_STEP_ID, FIRST_STEP_KEY);
const second = agentNode(SECOND_STEP_ID, SECOND_STEP_KEY);

const variablesAtSecond = (
  port: PortName,
  status: RunStepStatus.Succeeded | RunStepStatus.Failed,
) => {
  const flow = stepFlow(
    [first, second],
    [flowEdge(TEST_NODE_ID, FIRST_STEP_ID), flowEdge(FIRST_STEP_ID, SECOND_STEP_ID, port)],
  );
  const steps = new Map([[FIRST_STEP_ID, finishedStep(ids, first, status, port)]]);
  return stepVariables({ flow, lookup: createScopeLookup(flow), trigger, steps }, SECOND_STEP_ID);
};

describe('messageTriggerVariables', () => {
  it('takes the customer messages after the last reply as the current message', () => {
    expect(trigger).toEqual({
      message: {
        text: [TEST_FOLLOW_UP, TEST_MESSAGE_TEXT].join(CURRENT_MESSAGE_SEPARATOR),
        attachments: [],
      },
      user: { name: TEST_END_USER_NAME, language: null },
      channel: ChannelKind.Simulated,
      history: history.map(({ author, text }) => ({ author, text })),
      today: TEST_TODAY,
    });
  });
});

describe('stepVariables', () => {
  it('adds the output of an earlier step under its key', () => {
    expect(variablesAtSecond(PortName.Next, RunStepStatus.Succeeded)).toEqual({
      ...trigger,
      [FIRST_STEP_KEY]: { answer: FIRST_STEP_KEY },
    });
  });

  it('leaves out a step that failed into its error port', () => {
    expect(variablesAtSecond(PortName.Error, RunStepStatus.Failed)).toEqual(trigger);
  });
});

describe('stepInput', () => {
  it('saves the variables without the history', () => {
    const { history: _history, ...saved } = trigger;

    expect(stepInput(variablesAtSecond(PortName.Next, RunStepStatus.Succeeded))).toEqual({
      ...saved,
      [FIRST_STEP_KEY]: { answer: FIRST_STEP_KEY },
    });
  });
});
