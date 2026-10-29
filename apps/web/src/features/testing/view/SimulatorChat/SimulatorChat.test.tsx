import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChatEventKind, ChatItemKind } from '@/features/testing/constants/simulator.constants';
import type { ChatTurnItem } from '@/features/testing/typedefs/simulator.typedefs';
import { SimulatorChat } from '@/features/testing/view/SimulatorChat/SimulatorChat';
import { MessageAuthor, RunTrigger } from '@/shared/api/generated/schema.generated';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const AGENT_NAME = 'Salon assistant';
const durationLabel = (minutes: number) => `${minutes} min`;
const scheduleName = () => 'Nightly check-in';

const turnOf = (escalationMessageCount: number): ChatTurnItem => ({
  kind: ChatItemKind.Turn,
  id: 'run_1',
  at: '2026-10-11T10:00:00.000Z',
  messages: [
    {
      id: 'm1',
      author: MessageAuthor.Agent,
      text: 'Got your message.',
      runId: 'run_1',
      createdAt: '2026-10-11T10:00:01.000Z',
    },
    {
      id: 'm2',
      author: MessageAuthor.Agent,
      text: 'A person will answer soon.',
      runId: 'run_1',
      createdAt: '2026-10-11T10:00:02.000Z',
    },
  ],
  failed: false,
  escalated: true,
  escalatedByStep: true,
  handedBack: false,
  escalationMessageCount,
  errorMessage: null,
  finishedAt: null,
  trigger: RunTrigger.Message,
  attempt: null,
});

const renderTurn = (turn: ChatTurnItem) =>
  renderWithProviders(
    <SimulatorChat
      items={[turn]}
      agentName={AGENT_NAME}
      typing={false}
      selectedRunId={null}
      onSelectRun={vi.fn<(runId: string) => void>()}
      durationLabel={durationLabel}
      scheduleName={scheduleName}
    />,
  );

describe('SimulatorChat', () => {
  it('labels the message the escalation step sent, not the first bubble of the turn', () => {
    renderTurn(turnOf(1));
    const label = screen.getByText('Escalation message');

    expect(screen.getByRole('button', { name: `${AGENT_NAME} · 2 messages` })).toBeInTheDocument();
    expect(screen.getAllByText('Escalation message')).toHaveLength(1);
    expect(label.compareDocumentPosition(screen.getByText('A person will answer soon.'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(label.compareDocumentPosition(screen.getByText('Got your message.'))).toBe(
      Node.DOCUMENT_POSITION_PRECEDING,
    );
  });

  it('scrolls to the latest item', () => {
    const height = vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(480);
    renderTurn(turnOf(1));

    expect(screen.getByRole('list', { name: 'Test conversation' }).scrollTop).toBe(480);
    height.mockRestore();
  });

  it('shows no escalation label when the escalation sent nothing', () => {
    renderTurn(turnOf(0));

    expect(screen.queryByText('Escalation message')).not.toBeInTheDocument();
  });

  it('says a turn that sent nothing got no reply', () => {
    renderWithProviders(
      <SimulatorChat
        items={[
          {
            kind: ChatItemKind.Turn,
            id: 'run_1',
            at: '2026-10-11T10:00:00.000Z',
            messages: [],
            failed: true,
            escalated: false,
            escalatedByStep: false,
            handedBack: false,
            escalationMessageCount: 0,
            errorMessage: null,
            finishedAt: null,
            trigger: RunTrigger.Message,
            attempt: null,
          },
        ]}
        agentName={AGENT_NAME}
        typing={false}
        selectedRunId={null}
        onSelectRun={vi.fn<(runId: string) => void>()}
        durationLabel={durationLabel}
        scheduleName={scheduleName}
      />,
    );

    expect(screen.getByRole('button', { name: `${AGENT_NAME} · no reply` })).toBeInTheDocument();
  });

  it('shows conversation events as pills, with the time when it is known', () => {
    renderWithProviders(
      <SimulatorChat
        items={[
          {
            kind: ChatItemKind.Event,
            id: 'e1',
            at: '2026-10-11T10:00:00.000Z',
            event: ChatEventKind.Ended,
            minutes: null,
          },
          {
            kind: ChatItemKind.Event,
            id: 'e2',
            at: null,
            event: ChatEventKind.HandedBack,
            minutes: null,
          },
        ]}
        agentName={AGENT_NAME}
        typing={false}
        selectedRunId={null}
        onSelectRun={vi.fn<(runId: string) => void>()}
        durationLabel={durationLabel}
        scheduleName={scheduleName}
      />,
    );

    expect(screen.getByText(/^Ended by the agent · \d{1,2}:\d{2}/)).toBeInTheDocument();
    expect(screen.getByText('Handed back to the agent')).toBeInTheDocument();
  });

  it('labels a follow-up turn with its attempt and the silence before it', () => {
    renderWithProviders(
      <SimulatorChat
        items={[
          {
            kind: ChatItemKind.Event,
            id: 'e1',
            at: '2026-10-11T12:00:00.000Z',
            event: ChatEventKind.Silence,
            minutes: 120,
          },
          { ...turnOf(0), trigger: RunTrigger.Inactivity, attempt: 2, escalated: false },
        ]}
        agentName={AGENT_NAME}
        typing={false}
        selectedRunId={null}
        onSelectRun={vi.fn<(runId: string) => void>()}
        durationLabel={durationLabel}
        scheduleName={scheduleName}
      />,
    );

    expect(screen.getByText(/^120 min of silence simulated · \d{1,2}:\d{2}/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: `${AGENT_NAME} · inactivity follow-up 2 · 2 messages` }),
    ).toBeInTheDocument();
  });

  it('names the schedule that started a turn and marks the run before it', () => {
    renderWithProviders(
      <SimulatorChat
        items={[
          {
            kind: ChatItemKind.Event,
            id: 'e1',
            at: '2026-10-11T18:00:00.000Z',
            event: ChatEventKind.ScheduleRun,
            minutes: null,
          },
          { ...turnOf(0), trigger: RunTrigger.Schedule, escalated: false },
        ]}
        agentName={AGENT_NAME}
        typing={false}
        selectedRunId={null}
        onSelectRun={vi.fn<(runId: string) => void>()}
        durationLabel={durationLabel}
        scheduleName={scheduleName}
      />,
    );

    expect(screen.getByText(/^Schedule run now · \d{1,2}:\d{2}/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: `${AGENT_NAME} · Scheduled · Nightly check-in · 2 messages`,
      }),
    ).toBeInTheDocument();
  });
});
