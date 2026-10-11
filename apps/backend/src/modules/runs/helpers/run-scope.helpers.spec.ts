import { PortName, WaitFor, createScopeLookup } from '@agent-ic/flow';
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
  PARALLEL_NODE_ID,
  PARALLEL_NODE_KEY,
  RUNS_TEST_START,
  SCORER_NODE_ID,
  SCORER_NODE_KEY,
  SECOND_STEP_ID,
  SECOND_STEP_KEY,
  SEND_NODE_ID,
  SEND_NODE_KEY,
  TEST_AGENT_REPLY,
  TEST_END_USER_NAME,
  TEST_FOLLOW_UP,
  TEST_TODAY,
} from '@test/support/constants/runs-testing.constants';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import {
  agentNode,
  backgroundBranchEdge,
  branchEdge,
  completionNode,
  finishedStep,
  flowEdge,
  historyMessage,
  parallelNode,
  runConversation,
  sendListNode,
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

const variablesAtSendAfterScorer = () => {
  const scorer = completionNode(SCORER_NODE_ID, SCORER_NODE_KEY);
  const flow = stepFlow(
    [
      parallelNode(PARALLEL_NODE_ID, PARALLEL_NODE_KEY, WaitFor.All),
      first,
      scorer,
      sendListNode(SEND_NODE_ID, SEND_NODE_KEY, `${FIRST_STEP_KEY}.answer`),
    ],
    [
      flowEdge(TEST_NODE_ID, PARALLEL_NODE_ID),
      branchEdge(PARALLEL_NODE_ID, FIRST_STEP_ID),
      backgroundBranchEdge(PARALLEL_NODE_ID, SCORER_NODE_ID),
      flowEdge(PARALLEL_NODE_ID, SEND_NODE_ID),
    ],
  );
  const steps = new Map([
    [FIRST_STEP_ID, finishedStep(ids, first, RunStepStatus.Succeeded, PortName.Next)],
    [SCORER_NODE_ID, finishedStep(ids, scorer, RunStepStatus.Succeeded, PortName.Next)],
  ]);
  return stepVariables({ flow, lookup: createScopeLookup(flow), trigger, steps }, SEND_NODE_ID);
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

  it('hides a finished background branch output after the join', () => {
    expect(variablesAtSendAfterScorer()).toEqual({
      ...trigger,
      [FIRST_STEP_KEY]: { answer: FIRST_STEP_KEY },
    });
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
