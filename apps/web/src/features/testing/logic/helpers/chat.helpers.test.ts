import { describe, expect, it } from 'vitest';
import {
  ChatDividerKind,
  ChatItemKind,
  ChatSpeaker,
  ComposerMode,
} from '@/features/testing/constants/simulator.constants';
import {
  composerMode,
  isActiveRun,
  latestRunId,
  toChatItems,
  turnNumber,
} from '@/features/testing/logic/helpers/chat.helpers';
import type {
  SimulatorMessage,
  SimulatorRun,
} from '@/features/testing/typedefs/simulator.typedefs';
import {
  ConversationState,
  MessageAuthor,
  RunStatus,
} from '@/shared/api/generated/schema.generated';

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
  errorMessage: null,
});

describe('toChatItems', () => {
  it('groups the agent messages of one run into a turn', () => {
    const items = toChatItems(
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
      [
        message('m1', MessageAuthor.Customer, '2026-10-11T10:00:00Z'),
        message('m2', MessageAuthor.Customer, '2026-10-11T10:05:00Z'),
      ],
      [
        run('r1', RunStatus.Failed, '2026-10-11T10:00:01Z'),
        run('r2', RunStatus.Running, '2026-10-11T10:05:01Z'),
      ],
      ConversationState.AgentActive,
    );

    expect(items.map((item) => item.id)).toEqual(['m1', 'r1', 'm2']);
    expect(items[1]).toMatchObject({ messages: [], failed: true });
  });

  it('keeps an agent message outside a run as an agent message', () => {
    const items = toChatItems(
      [message('m1', MessageAuthor.Agent, '2026-10-11T10:00:00Z')],
      [],
      ConversationState.AgentActive,
    );

    expect(items).toMatchObject([{ kind: ChatItemKind.Message, speaker: ChatSpeaker.Agent }]);
  });

  it('marks the escalation and the hand-back with dividers', () => {
    const escalation = [
      message('m1', MessageAuthor.Customer, '2026-10-11T10:00:00Z'),
      message('m2', MessageAuthor.Agent, '2026-10-11T10:00:02Z', 'r1'),
      message('m3', MessageAuthor.Operator, '2026-10-11T10:01:00Z'),
      message('m4', MessageAuthor.Operator, '2026-10-11T10:02:00Z'),
    ];
    const runs = [run('r1', RunStatus.Escalated, '2026-10-11T10:00:01Z')];
    const dividers = (state: ConversationState) =>
      toChatItems(escalation, runs, state).flatMap((item) =>
        item.kind === ChatItemKind.Divider ? [[item.divider, item.at]] : [],
      );

    expect(dividers(ConversationState.Handled)).toEqual([
      [ChatDividerKind.Escalated, '2026-10-11T10:00:02Z'],
    ]);
    expect(dividers(ConversationState.AgentActive)).toEqual([
      [ChatDividerKind.Escalated, '2026-10-11T10:00:02Z'],
      [ChatDividerKind.HandedBack, '2026-10-11T10:02:00Z'],
    ]);
  });

  it('marks a hand-back that comes without an operator reply', () => {
    const escalation = [
      message('m1', MessageAuthor.Customer, '2026-10-11T10:00:00Z'),
      message('m2', MessageAuthor.Agent, '2026-10-11T10:00:02Z', 'r1'),
    ];
    const runs = [run('r1', RunStatus.Escalated, '2026-10-11T10:00:01Z')];
    const dividers = (state: ConversationState) =>
      toChatItems(escalation, runs, state).flatMap((item) =>
        item.kind === ChatItemKind.Divider ? [item.divider] : [],
      );

    expect(dividers(ConversationState.Waiting)).toEqual([ChatDividerKind.Escalated]);
    expect(dividers(ConversationState.AgentActive)).toEqual([
      ChatDividerKind.Escalated,
      ChatDividerKind.HandedBack,
    ]);
  });

  it('keeps the hand-back divider once the chat goes on', () => {
    const items = toChatItems(
      [
        message('m1', MessageAuthor.Operator, '2026-10-11T10:00:00Z'),
        message('m2', MessageAuthor.Customer, '2026-10-11T10:01:00Z'),
      ],
      [],
      ConversationState.Waiting,
    );

    expect(items.map((item) => item.kind)).toEqual([
      ChatItemKind.Message,
      ChatItemKind.Divider,
      ChatItemKind.Message,
    ]);
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
