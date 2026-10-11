import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEMO_AGENT_ID,
  DRAFT_REVISION,
  TRIGGER_ONLY_FLOW,
} from '@/features/flow-builder/communication/fixtures/flowBuilderDraft.fixture';
import { lastSimulationRunMock } from '@/features/flow-builder/communication/fixtures/lastSimulationRun.fixture';
import { LastRunBar } from '@/features/flow-builder/containers/LastRunBar/LastRunBar';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import { RunStatus } from '@/shared/api/generated/schema.generated';
import { MemoryRouter } from '@test/support/components/MemoryRouter';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const NOW = Date.parse('2026-10-11T12:00:00Z');
const EIGHT_MINUTES_AGO = '2026-10-11T11:52:00Z';

const renderBar = (mock: ReturnType<typeof lastSimulationRunMock>) =>
  renderWithProviders(
    <MemoryRouter>
      <LastRunBar workspaceId="wsp_demo" agentId={DEMO_AGENT_ID} />
    </MemoryRouter>,
    { mocks: [mock] },
  );

describe('LastRunBar', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
    useFlowBuilderStore
      .getState()
      .load({ document: TRIGGER_ONLY_FLOW, revision: DRAFT_REVISION, issues: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows a clean run on the current draft', async () => {
    renderBar(
      lastSimulationRunMock({
        status: RunStatus.Succeeded,
        finishedAt: EIGHT_MINUTES_AGO,
        draftRevision: DRAFT_REVISION,
      }),
    );

    expect(await screen.findByText('Last test run')).toBeInTheDocument();
    expect(screen.getByText('Simulator · no errors · 8 minutes ago')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Test in simulator' })).toBeInTheDocument();
  });

  it('says when the run tested an earlier draft', async () => {
    renderBar(
      lastSimulationRunMock({
        status: RunStatus.Failed,
        finishedAt: EIGHT_MINUTES_AGO,
        draftRevision: DRAFT_REVISION - 1,
      }),
    );

    expect(
      await screen.findByText('Simulator · failed · 8 minutes ago · on an earlier draft'),
    ).toBeInTheDocument();
  });

  it('does not count a run on a published version as testing the draft', async () => {
    renderBar(
      lastSimulationRunMock({
        status: RunStatus.Succeeded,
        finishedAt: EIGHT_MINUTES_AGO,
        draftRevision: null,
      }),
    );

    expect(
      await screen.findByText('Simulator · no errors · 8 minutes ago · on a published version'),
    ).toBeInTheDocument();
  });

  it('asks to test a draft that was never simulated', async () => {
    renderBar(lastSimulationRunMock(null));

    expect(await screen.findByText('Not tested yet')).toBeInTheDocument();
  });
});
