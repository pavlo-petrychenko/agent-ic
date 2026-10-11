import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChatItemKind } from '@/features/testing/constants/simulator.constants';
import { SimulatorChat } from '@/features/testing/view/SimulatorChat/SimulatorChat';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const AGENT_NAME = 'Salon assistant';

describe('SimulatorChat', () => {
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
            errorMessage: null,
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
});
