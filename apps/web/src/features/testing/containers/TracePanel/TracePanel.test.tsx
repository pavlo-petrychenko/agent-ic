import type { MockLink } from '@apollo/client/testing';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  REPLY_NODE_ID,
  TEST_AGENT_ID,
  TEST_WORKSPACE_ID,
  TRACE_FLOW,
} from '@/features/testing/communication/fixtures/testing.fixture';
import {
  STEP_ERROR,
  TRACE_RUN_ID,
  testingRunMock,
} from '@/features/testing/communication/fixtures/trace.fixture';
import { TracePanel } from '@/features/testing/containers/TracePanel/TracePanel';
import { RunStatus, RunStepStatus } from '@/shared/api/generated/schema.generated';
import { MemoryRouter } from '@test/support/components/MemoryRouter';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const renderPanel = (status: RunStatus, mocks: readonly MockLink.MockedResponse[], draft = true) =>
  renderWithProviders(
    <MemoryRouter>
      <TracePanel
        workspaceId={TEST_WORKSPACE_ID}
        agentId={TEST_AGENT_ID}
        flow={TRACE_FLOW}
        run={{ id: TRACE_RUN_ID, status, createdAt: '2026-10-11T10:00:00Z', errorMessage: null }}
        turnNumber={2}
        draft={draft}
        liveNumber={3}
      />
    </MemoryRouter>,
    { mocks },
  );

const stepState = async (name: string) =>
  (await within(await screen.findByRole('list', { name: 'Steps of the flow' })).findByText(name))
    .closest('li')
    ?.getAttribute('data-state');

describe('TracePanel', () => {
  it('shows the running node of a running turn', async () => {
    renderPanel(RunStatus.Running, [testingRunMock(RunStatus.Running, RunStepStatus.Running)]);

    expect(await screen.findByText('Live flow · turn 2')).toBeInTheDocument();
    await within(await screen.findByRole('list', { name: 'Steps of the flow' })).findByText(
      'running',
    );
    expect(await stepState('Incoming message')).toBe('done');
    expect(await stepState('Send replies')).toBe('running');
  });

  it('marks the failed step and links to it in the flow builder', async () => {
    renderPanel(RunStatus.Failed, [testingRunMock(RunStatus.Failed, RunStepStatus.Failed)]);
    await screen.findByText('Failed');

    expect(await stepState('Send replies')).toBe('failed');
    expect(
      within(screen.getByRole('list', { name: 'Step states' })).getByText('failed'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open in flow builder' })).toHaveAttribute(
      'href',
      `/w/${TEST_WORKSPACE_ID}/agents/${TEST_AGENT_ID}?node=${REPLY_NODE_ID}`,
    );
  });

  it('lists the failed step with its error in the turn details', async () => {
    renderPanel(RunStatus.Failed, [testingRunMock(RunStatus.Failed, RunStepStatus.Failed)]);
    const details = await screen.findByRole('complementary', { name: 'Turn details' });

    expect(await within(details).findByText(STEP_ERROR)).toBeInTheDocument();
    expect(within(details).getByRole('heading', { name: 'Send replies' })).toBeInTheDocument();
  });

  it('shows the steps a finished turn never reached and its details', async () => {
    renderPanel(RunStatus.Succeeded, [testingRunMock(RunStatus.Succeeded, null)]);

    expect(await screen.findByRole('heading', { name: 'Turn 2' })).toBeInTheDocument();
    expect(await stepState('Send replies')).toBe('skipped');
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('2.1 s')).toBeInTheDocument();
    expect(screen.getByText('2 of 2')).toBeInTheDocument();
    expect(screen.getByText('needs_human')).toBeInTheDocument();
  });

  it('names the live version under a draft run only', async () => {
    const { unmount } = renderPanel(RunStatus.Succeeded, [
      testingRunMock(RunStatus.Succeeded, null),
    ]);
    expect(await screen.findByText(/customers keep talking to v3/)).toBeInTheDocument();
    unmount();

    renderPanel(RunStatus.Succeeded, [testingRunMock(RunStatus.Succeeded, null)], false);

    expect(screen.queryByText(/customers keep talking/)).not.toBeInTheDocument();
  });
});
