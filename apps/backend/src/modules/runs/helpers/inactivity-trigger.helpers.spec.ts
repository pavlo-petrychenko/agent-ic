import { IdPrefix } from '@agent-ic/contracts';
import { InactivityRepeatKind } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { MessageAuthor } from '@/modules/conversations';
import {
  inactivityTriggerInput,
  inactivityTriggerInputOf,
  inactivityTriggerVariables,
} from '@/modules/runs/helpers/inactivity-trigger.helpers';
import type { RunTriggerInput } from '@/modules/runs/typedefs/run.typedefs';
import { IdService } from '@/platform/ids/services/id.service';
import { TEST_MESSAGE_TEXT } from '@test/support/constants/conversations-testing.constants';
import {
  RUNS_TEST_START,
  TEST_AGENT_REPLY,
  TEST_INACTIVITY_MAX_TIMES,
  TEST_SILENT_MINUTES,
  TEST_TODAY,
} from '@test/support/constants/runs-testing.constants';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import {
  historyMessage,
  inactivityTriggerNode,
  runConversation,
} from '@test/support/fixtures/runs.fixture';

const ids = new IdService(new ManualClock(RUNS_TEST_START));
const conversation = runConversation(ids);
const conversationId = ids.toPublic(IdPrefix.Conversation, conversation.id);
const history = [
  historyMessage(conversation, MessageAuthor.Customer, TEST_MESSAGE_TEXT),
  historyMessage(conversation, MessageAuthor.Agent, TEST_AGENT_REPLY),
];
const input = { attempt: 2, silentMinutes: TEST_SILENT_MINUTES };

describe('inactivityTriggerVariables', () => {
  it('gives the conversation, the shared trigger variables and the attempt of this silence', () => {
    const variables = inactivityTriggerVariables(inactivityTriggerNode(), {
      conversation,
      conversationId,
      history,
      today: RUNS_TEST_START,
      input,
    });

    expect(variables).toEqual({
      conversation: {
        id: conversationId,
        started_at: conversation.createdAt.toISOString(),
        last_message_at: conversation.lastMessageAt.toISOString(),
      },
      user: { name: conversation.endUserName, language: conversation.endUserLanguage },
      channel: conversation.channelKind,
      history: [
        { author: MessageAuthor.Customer, text: TEST_MESSAGE_TEXT },
        { author: MessageAuthor.Agent, text: TEST_AGENT_REPLY },
      ],
      today: TEST_TODAY,
      inactivity: {
        silent_minutes: TEST_SILENT_MINUTES,
        attempt: 2,
        max_attempts: TEST_INACTIVITY_MAX_TIMES,
        last_author: MessageAuthor.Agent,
      },
    });
  });

  it('allows one attempt for a trigger that fires once', () => {
    const node = inactivityTriggerNode({ repeat: { kind: InactivityRepeatKind.Once } });

    const variables = inactivityTriggerVariables(node, {
      conversation,
      conversationId,
      history,
      today: RUNS_TEST_START,
      input: { attempt: 1, silentMinutes: TEST_SILENT_MINUTES },
    });

    expect(variables.inactivity).toMatchObject({ attempt: 1, max_attempts: 1 });
  });
});

describe('inactivityTriggerInput', () => {
  it('reads back the input it stores', () => {
    expect(inactivityTriggerInputOf(inactivityTriggerInput(input))).toEqual(input);
  });

  it.each<RunTriggerInput | null>([
    null,
    { attempt: 0, silentMinutes: TEST_SILENT_MINUTES },
    { attempt: 1 },
  ])('refuses a run input that is not an inactivity attempt: %j', (stored) => {
    expect(() => inactivityTriggerInputOf(stored)).toThrow(ZodError);
  });
});
