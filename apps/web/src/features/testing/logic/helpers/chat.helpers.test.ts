import { describe, expect, it } from 'vitest';
import { ChatItemKind, ChatSpeaker } from '@/features/testing/constants/simulator.constants';
import {
  isActiveRun,
  latestRunId,
  toChatItems,
} from '@/features/testing/logic/helpers/chat.helpers';
import type {
  SimulatorMessage,
  SimulatorRun,
} from '@/features/testing/typedefs/simulator.typedefs';
import { MessageAuthor, RunStatus } from '@/shared/api/generated/schema.generated';

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
    );

    expect(items.map((item) => item.id)).toEqual(['m1', 'r1', 'm2']);
    expect(items[1]).toMatchObject({ messages: [], failed: true });
  });

  it('keeps an agent message outside a run as an agent message', () => {
    const items = toChatItems([message('m1', MessageAuthor.Agent, '2026-10-11T10:00:00Z')], []);

    expect(items).toMatchObject([{ kind: ChatItemKind.Message, speaker: ChatSpeaker.Agent }]);
  });
});

describe('isActiveRun', () => {
  it('treats queued and running runs as active', () => {
    expect(isActiveRun(run('r', RunStatus.Queued, ''))).toBe(true);
    expect(isActiveRun(run('r', RunStatus.Running, ''))).toBe(true);
    expect(isActiveRun(run('r', RunStatus.Escalated, ''))).toBe(false);
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
