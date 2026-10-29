import { describe, expect, it } from 'vitest';
import {
  ChatEventKind,
  ChatItemKind,
  ChatSpeaker,
  ComposerMode,
} from '@/features/testing/constants/simulator.constants';
import { HandedBackStatus } from '@/features/testing/constants/trace.constants';
import {
  composerMode,
  handedBackRunIds,
  isActiveRun,
  latestRunId,
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
      eventsOf(toChatItems(conversation(messages, runs, state)));

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
      eventsOf(toChatItems(conversation(escalatedChat, runs, ConversationState.Waiting))),
    ).toEqual([[ChatEventKind.HandedOff, '2026-10-11T10:00:02Z']]);
  });

  it('marks a hand-back that comes without an operator reply', () => {
    const runs = [run('r1', RunStatus.Escalated, '2026-10-11T10:00:01Z')];
    const events = (state: ConversationState) =>
      eventsOf(toChatItems(conversation(escalatedChat, runs, state))).map(([event]) => event);

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
        ],
        [],
        ConversationState.Waiting,
      ),
    );

    expect(items.map((item) => item.kind)).toEqual([
      ChatItemKind.Event,
      ChatItemKind.Message,
      ChatItemKind.Event,
      ChatItemKind.Message,
    ]);
  });

  it('ends a closed chat with the reason it closed and the time', () => {
    const messages = [
      message('m1', MessageAuthor.Customer, '2026-10-11T10:00:00Z'),
      message('m2', MessageAuthor.Agent, '2026-10-11T10:00:02Z', 'r1'),
    ];
    const runs = [run('r1', RunStatus.Succeeded, '2026-10-11T10:00:01Z')];
    const closedBy = (reason: ConversationCloseReason | null) =>
      toChatItems(conversation(messages, runs, ConversationState.Closed, reason)).at(-1);

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

describe('composerMode', () => {
  it('offers the operator reply after an escalation until the chat is handed back', () => {
    expect(composerMode(ConversationState.AgentActive, true)).toBe(ComposerMode.User);
    expect(composerMode(ConversationState.Waiting, false)).toBe(ComposerMode.Escalated);
    expect(composerMode(ConversationState.Waiting, true)).toBe(ComposerMode.Operator);
    expect(composerMode(ConversationState.Handled, false)).toBe(ComposerMode.Operator);
  });

  it('ends the composer once the conversation is closed', () => {
    expect(composerMode(ConversationState.Closed, true)).toBe(ComposerMode.Ended);
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
    expect(turnStatus(RunStatus.Escalated, true)).toBe(HandedBackStatus.HandedBack);
    expect(turnStatus(RunStatus.Escalated, false)).toBe(RunStatus.Escalated);
    expect(turnStatus(RunStatus.Succeeded, true)).toBe(RunStatus.Succeeded);
  });
});
