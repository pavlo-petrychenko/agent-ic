import { describe, expect, it } from 'vitest';
import {
  ChatEventKind,
  ChatItemKind,
  ChatSpeaker,
  ComposerMode,
} from '@/features/testing/constants/simulator.constants';
import { TurnOutcome } from '@/features/testing/constants/trace.constants';
import {
  closingOutcome,
  canWriteAsOperator,
  composerMode,
  handedBackRunIds,
  isActiveRun,
  latestRunId,
  runTexts,
  toChatItems,
  turnNumber,
  turnStatus,
} from '@/features/testing/logic/helpers/chat.helpers';
import type {
  ChatItem,
  SimulatorConversation,
  SimulatorMessage,
  SimulatorRun,
} from '@/features/testing/typedefs/simulator.typedefs';
import {
  ConversationCloseReason,
  ConversationState,
  MessageAuthor,
  RunStatus,
  RunTrigger,
} from '@/shared/api/generated/schema.generated';

const CLOSED_AT = '2026-10-11T11:00:00Z';

const message = (
  id: string,
  author: MessageAuthor,
  createdAt: string,
  runId: string | null = null,
): SimulatorMessage => ({ id, author, text: id, runId, createdAt });

const run = (id: string, status: RunStatus, createdAt: string): SimulatorRun => ({
  id,
  trigger: RunTrigger.Message,
  inactivityAttempt: null,
  status,
  createdAt,
  finishedAt: null,
  errorMessage: null,
  escalationMessageCount: 0,
  escalatedByStep: true,
});

const conversation = (
  messages: readonly SimulatorMessage[],
  runs: readonly SimulatorRun[],
  state: ConversationState,
  closeReason: ConversationCloseReason | null = null,
): SimulatorConversation => ({
  conversationId: 'cnv_1',
  state,
  closeReason,
  closedAt: state === ConversationState.Closed ? CLOSED_AT : null,
  messages,
  runs,
});

const eventsOf = (items: readonly ChatItem[]) =>
  items.flatMap((item) => (item.kind === ChatItemKind.Event ? [[item.event, item.at]] : []));

const escalatedChat = [
  message('m1', MessageAuthor.Customer, '2026-10-11T10:00:00Z'),
  message('m2', MessageAuthor.Agent, '2026-10-11T10:00:02Z', 'r1'),
];

describe('toChatItems', () => {
  it('counts the messages an escalation step sent on the turn', () => {
    const items = toChatItems(
      conversation(
        [...escalatedChat, message('m3', MessageAuthor.Agent, '2026-10-11T10:00:03Z', 'r1')],
        [{ ...run('r1', RunStatus.Escalated, '2026-10-11T10:00:01Z'), escalationMessageCount: 1 }],
        ConversationState.Waiting,
      ),
      [],
    );

    expect(items[1]).toMatchObject({
      escalated: true,
      escalationMessageCount: 1,
      handedBack: false,
    });
  });

  it('marks an escalated turn as handed back once the chat is handed back', () => {
    const messages = [
      ...escalatedChat,
      message('m3', MessageAuthor.Operator, '2026-10-11T10:01:00Z'),
    ];
    const runs = [run('r1', RunStatus.Escalated, '2026-10-11T10:00:01Z')];
    const handedBack = (state: ConversationState) =>
      handedBackRunIds(conversation(messages, runs, state));

    expect(handedBack(ConversationState.Waiting).size).toBe(0);
    expect(handedBack(ConversationState.Handled).size).toBe(0);
    expect([...handedBack(ConversationState.AgentActive)]).toEqual(['r1']);
  });

  it('does not read a customer message written while waiting as a hand back', () => {
    const waiting = [
      ...escalatedChat,
      message('m3', MessageAuthor.Customer, '2026-10-11T10:01:00Z'),
    ];
    const runs = [run('r1', RunStatus.Escalated, '2026-10-11T10:00:01Z')];

    expect(handedBackRunIds(conversation(waiting, runs, ConversationState.Waiting)).size).toBe(0);
    expect(
      handedBackRunIds(
        conversation(
          [...waiting, message('m4', MessageAuthor.Operator, '2026-10-11T10:02:00Z')],
          runs,
          ConversationState.Handled,
        ),
      ).size,
    ).toBe(0);
  });

  it('marks the turn handed back when the customer wrote while waiting', () => {
    const messages = [
      ...escalatedChat,
      message('m3', MessageAuthor.Customer, '2026-10-11T10:01:00Z'),
      message('m4', MessageAuthor.Operator, '2026-10-11T10:02:00Z'),
    ];
    const runs = [run('r1', RunStatus.Escalated, '2026-10-11T10:00:01Z')];

    expect([
      ...handedBackRunIds(conversation(messages, runs, ConversationState.AgentActive)),
    ]).toEqual(['r1']);
  });

  it('leaves a turn that escalated again after a hand back as escalated', () => {
    const messages = [
      ...escalatedChat,
      message('m3', MessageAuthor.Customer, '2026-10-11T10:05:00Z'),
      message('m4', MessageAuthor.Agent, '2026-10-11T10:05:02Z', 'r2'),
    ];
    const runs = [
      run('r1', RunStatus.Escalated, '2026-10-11T10:00:01Z'),
      run('r2', RunStatus.Escalated, '2026-10-11T10:05:01Z'),
    ];

    expect([...handedBackRunIds(conversation(messages, runs, ConversationState.Waiting))]).toEqual([
      'r1',
    ]);
  });

  it('groups the agent messages of one run into a turn', () => {
    const items = toChatItems(
      conversation(
        [
          message('m1', MessageAuthor.Customer, '2026-10-11T10:00:00Z'),
          message('m2', MessageAuthor.Agent, '2026-10-11T10:00:02Z', 'r1'),
          message('m3', MessageAuthor.Agent, '2026-10-11T10:00:03Z', 'r1'),
          message('m4', MessageAuthor.Customer, '2026-10-11T10:01:00Z'),
          message('m5', MessageAuthor.Agent, '2026-10-11T10:01:02Z', 'r2'),
        ],
        [
          run('r1', RunStatus.Succeeded, '2026-10-11T10:00:01Z'),
          run('r2', RunStatus.Succeeded, '2026-10-11T10:01:01Z'),
        ],
        ConversationState.AgentActive,
      ),
      [],
    );

    expect(items.map((item) => [item.kind, item.id])).toEqual([
      [ChatItemKind.Message, 'm1'],
      [ChatItemKind.Turn, 'r1'],
      [ChatItemKind.Message, 'm4'],
      [ChatItemKind.Turn, 'r2'],
    ]);
    expect(items[1]).toMatchObject({ messages: [{ id: 'm2' }, { id: 'm3' }], failed: false });
  });

  it('places a finished turn without messages after the message that started it', () => {
    const items = toChatItems(
      conversation(
        [
          message('m1', MessageAuthor.Customer, '2026-10-11T10:00:00Z'),
          message('m2', MessageAuthor.Customer, '2026-10-11T10:05:00Z'),
        ],
        [
          run('r1', RunStatus.Failed, '2026-10-11T10:00:01Z'),
          run('r2', RunStatus.Running, '2026-10-11T10:05:01Z'),
        ],
        ConversationState.AgentActive,
      ),
      [],
    );

    expect(items.map((item) => item.id)).toEqual(['m1', 'r1', 'm2']);
    expect(items[1]).toMatchObject({ messages: [], failed: true });
  });

  it('keeps an agent message outside a run as an agent message', () => {
    const items = toChatItems(
      conversation(
        [message('m1', MessageAuthor.Agent, '2026-10-11T10:00:00Z')],
        [],
        ConversationState.AgentActive,
      ),
      [],
    );

    expect(items).toMatchObject([{ kind: ChatItemKind.Message, speaker: ChatSpeaker.Agent }]);
  });

  it('marks the escalation, the take-over and the hand-back with timed events', () => {
    const messages = [
      ...escalatedChat,
      message('m3', MessageAuthor.Operator, '2026-10-11T10:01:00Z'),
      message('m4', MessageAuthor.Operator, '2026-10-11T10:02:00Z'),
    ];
    const runs = [
      {
        ...run('r1', RunStatus.Escalated, '2026-10-11T10:00:01Z'),
        finishedAt: '2026-10-11T10:00:04Z',
      },
    ];
    const events = (state: ConversationState) =>
      eventsOf(toChatItems(conversation(messages, runs, state), []));

    expect(events(ConversationState.Handled)).toEqual([
      [ChatEventKind.Escalated, '2026-10-11T10:00:04Z'],
      [ChatEventKind.TakenOver, '2026-10-11T10:01:00Z'],
    ]);
    expect(events(ConversationState.AgentActive)).toEqual([
      [ChatEventKind.Escalated, '2026-10-11T10:00:04Z'],
      [ChatEventKind.TakenOver, '2026-10-11T10:01:00Z'],
      [ChatEventKind.HandedBack, null],
    ]);
  });

  it('says the agent handed off when no escalation step ran', () => {
    const runs = [
      { ...run('r1', RunStatus.Escalated, '2026-10-11T10:00:01Z'), escalatedByStep: false },
    ];

    expect(
      eventsOf(toChatItems(conversation(escalatedChat, runs, ConversationState.Waiting), [])),
    ).toEqual([[ChatEventKind.HandedOff, '2026-10-11T10:00:02Z']]);
  });

  it('marks a hand-back that comes without an operator reply', () => {
    const runs = [run('r1', RunStatus.Escalated, '2026-10-11T10:00:01Z')];
    const events = (state: ConversationState) =>
      eventsOf(toChatItems(conversation(escalatedChat, runs, state), [])).map(([event]) => event);

    expect(events(ConversationState.Waiting)).toEqual([ChatEventKind.Escalated]);
    expect(events(ConversationState.AgentActive)).toEqual([
      ChatEventKind.Escalated,
      ChatEventKind.HandedBack,
    ]);
  });

  it('keeps the hand-back event once the chat goes on', () => {
    const items = toChatItems(
      conversation(
        [
          message('m1', MessageAuthor.Operator, '2026-10-11T10:00:00Z'),
          message('m2', MessageAuthor.Customer, '2026-10-11T10:01:00Z'),
          message('m3', MessageAuthor.Agent, '2026-10-11T10:01:02Z', 'r1'),
        ],
        [run('r1', RunStatus.Succeeded, '2026-10-11T10:01:01Z')],
        ConversationState.AgentActive,
      ),
      [],
    );

    expect(items.map((item) => item.kind)).toEqual([
      ChatItemKind.Event,
      ChatItemKind.Message,
      ChatItemKind.Event,
      ChatItemKind.Message,
      ChatItemKind.Turn,
    ]);
  });

  it('ends a closed chat with the reason it closed and the time', () => {
    const messages = [
      message('m1', MessageAuthor.Customer, '2026-10-11T10:00:00Z'),
      message('m2', MessageAuthor.Agent, '2026-10-11T10:00:02Z', 'r1'),
    ];
    const runs = [run('r1', RunStatus.Succeeded, '2026-10-11T10:00:01Z')];
    const closedBy = (reason: ConversationCloseReason | null) =>
      toChatItems(conversation(messages, runs, ConversationState.Closed, reason), []).at(-1);

    expect(closedBy(ConversationCloseReason.EndedByAgent)).toMatchObject({
      event: ChatEventKind.Ended,
      at: CLOSED_AT,
    });
    expect(closedBy(null)).toMatchObject({ event: ChatEventKind.Ended });
    expect(closedBy(ConversationCloseReason.Inactivity)).toMatchObject({
      event: ChatEventKind.ClosedInactive,
      at: CLOSED_AT,
    });
  });
});

describe('toChatItems with follow-ups', () => {
  it('puts the simulated silence before each follow-up turn', () => {
    const followUp = {
      ...run('r2', RunStatus.Succeeded, '2026-10-11T12:00:00Z'),
      trigger: RunTrigger.Inactivity,
      inactivityAttempt: 2,
    };
    const items = toChatItems(
      conversation(
        [
          message('m1', MessageAuthor.Customer, '2026-10-11T10:00:00Z'),
          message('m2', MessageAuthor.Agent, '2026-10-11T12:00:01Z', 'r2'),
        ],
        [followUp],
        ConversationState.AgentActive,
      ),
      [120, 240],
    );

    expect(items[1]).toMatchObject({
      kind: ChatItemKind.Event,
      event: ChatEventKind.Silence,
      minutes: 240,
    });
    expect(items[2]).toMatchObject({
      kind: ChatItemKind.Turn,
      trigger: RunTrigger.Inactivity,
      attempt: 2,
    });
  });
});

describe('composerMode', () => {
  it('writes as the customer while the agent answers, whatever was picked', () => {
    expect(composerMode(ConversationState.AgentActive, ComposerMode.Operator)).toBe(
      ComposerMode.User,
    );
  });

  it('writes as the customer while the chat waits, until Operator is picked', () => {
    expect(composerMode(ConversationState.Waiting, null)).toBe(ComposerMode.User);
    expect(composerMode(ConversationState.Waiting, ComposerMode.Operator)).toBe(
      ComposerMode.Operator,
    );
  });

  it('writes as the operator once taken over, until Customer is picked', () => {
    expect(composerMode(ConversationState.Handled, null)).toBe(ComposerMode.Operator);
    expect(composerMode(ConversationState.Handled, ComposerMode.User)).toBe(ComposerMode.User);
  });

  it('ends the composer once the conversation is closed', () => {
    expect(composerMode(ConversationState.Closed, ComposerMode.Operator)).toBe(ComposerMode.Ended);
  });
});

describe('canWriteAsOperator', () => {
  it('offers the operator only while a person handles the chat', () => {
    expect(canWriteAsOperator(ConversationState.Waiting)).toBe(true);
    expect(canWriteAsOperator(ConversationState.Handled)).toBe(true);
    expect(canWriteAsOperator(ConversationState.AgentActive)).toBe(false);
    expect(canWriteAsOperator(ConversationState.Closed)).toBe(false);
  });
});

describe('isActiveRun', () => {
  it('treats queued and running runs as active', () => {
    expect(isActiveRun(run('r', RunStatus.Queued, ''))).toBe(true);
    expect(isActiveRun(run('r', RunStatus.Running, ''))).toBe(true);
    expect(isActiveRun(run('r', RunStatus.Escalated, ''))).toBe(false);
  });
});

describe('turnNumber', () => {
  it('counts the turns in the order they started', () => {
    const runs = [
      run('r2', RunStatus.Succeeded, '2026-10-11T10:01:00Z'),
      run('r1', RunStatus.Succeeded, '2026-10-11T10:00:00Z'),
    ];

    expect(turnNumber(runs, 'r2')).toBe(2);
    expect(turnNumber(runs, 'gone')).toBeNull();
  });
});

describe('latestRunId', () => {
  it('returns the most recent run or null', () => {
    expect(latestRunId([])).toBeNull();
    expect(
      latestRunId([
        run('r2', RunStatus.Succeeded, '2026-10-11T10:01:00Z'),
        run('r1', RunStatus.Succeeded, '2026-10-11T10:00:00Z'),
      ]),
    ).toBe('r2');
  });
});

describe('turnStatus', () => {
  it('turns an escalated run into handed back once the chat is handed back', () => {
    expect(turnStatus(RunStatus.Escalated, true, null)).toBe(TurnOutcome.HandedBack);
    expect(turnStatus(RunStatus.Escalated, false, null)).toBe(RunStatus.Escalated);
    expect(turnStatus(RunStatus.Succeeded, true, null)).toBe(RunStatus.Succeeded);
  });

  it('says how the chat closed instead of completed, but keeps a failure', () => {
    expect(turnStatus(RunStatus.Succeeded, false, TurnOutcome.Ended)).toBe(TurnOutcome.Ended);
    expect(turnStatus(RunStatus.Escalated, true, TurnOutcome.ClosedInactive)).toBe(
      TurnOutcome.ClosedInactive,
    );
    expect(turnStatus(RunStatus.Failed, false, TurnOutcome.Ended)).toBe(RunStatus.Failed);
  });
});

describe('closingOutcome', () => {
  it('tells an end by the agent from a close for inactivity', () => {
    const closed = (state: ConversationState, reason: ConversationCloseReason | null) =>
      closingOutcome(conversation([], [], state, reason));

    expect(closed(ConversationState.AgentActive, null)).toBeNull();
    expect(closed(ConversationState.Closed, null)).toBe(TurnOutcome.Ended);
    expect(closed(ConversationState.Closed, ConversationCloseReason.Inactivity)).toBe(
      TurnOutcome.ClosedInactive,
    );
  });
});

describe('runTexts', () => {
  it('returns the texts of one run in order', () => {
    const messages = [
      message('m1', MessageAuthor.Customer, '2026-10-11T10:00:00Z'),
      message('m2', MessageAuthor.Agent, '2026-10-11T10:00:02Z', 'r1'),
      message('m3', MessageAuthor.Agent, '2026-10-11T10:00:03Z', 'r1'),
    ];

    expect(runTexts(messages, 'r1')).toEqual(['m2', 'm3']);
    expect(runTexts(messages, null)).toEqual([]);
  });
});
