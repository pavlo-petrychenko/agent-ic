import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChatEventKind, ChatItemKind } from '@/features/testing/constants/simulator.constants';
import type { ChatTurnItem } from '@/features/testing/typedefs/simulator.typedefs';
import { SimulatorChat } from '@/features/testing/view/SimulatorChat/SimulatorChat';
import { MessageAuthor } from '@/shared/api/generated/schema.generated';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const AGENT_NAME = 'Salon assistant';

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
});

const renderTurn = (turn: ChatTurnItem) =>
  renderWithProviders(
    <SimulatorChat
      items={[turn]}
      agentName={AGENT_NAME}
      typing={false}
      selectedRunId={null}
      onSelectRun={vi.fn<(runId: string) => void>()}
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
          },
        ]}
        agentName={AGENT_NAME}
        typing={false}
        selectedRunId={null}
        onSelectRun={vi.fn<(runId: string) => void>()}
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
          },
          { kind: ChatItemKind.Event, id: 'e2', at: null, event: ChatEventKind.HandedBack },
        ]}
        agentName={AGENT_NAME}
        typing={false}
        selectedRunId={null}
        onSelectRun={vi.fn<(runId: string) => void>()}
      />,
    );

    expect(screen.getByText(/^Ended by the agent · \d{1,2}:\d{2}/)).toBeInTheDocument();
    expect(screen.getByText('Handed back to the agent')).toBeInTheDocument();
  });
});
