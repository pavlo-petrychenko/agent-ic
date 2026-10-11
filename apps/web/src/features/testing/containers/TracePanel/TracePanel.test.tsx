import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  REPLY_NODE_ID,
  TEST_AGENT_ID,
  TEST_WORKSPACE_ID,
  TRACE_FLOW,
} from '@/features/testing/communication/fixtures/testing.fixture';
import {
  TRACE_RUN_ID,
  testingRunMock,
} from '@/features/testing/communication/fixtures/trace.fixture';
import { TracePanel } from '@/features/testing/containers/TracePanel/TracePanel';
import { RunStatus, RunStepStatus } from '@/shared/api/generated/schema.generated';
import { MemoryRouter } from '@test/support/components/MemoryRouter';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const renderPanel = (status: RunStatus, mocks: readonly MockLink.MockedResponse[]) =>
  renderWithProviders(
    <MemoryRouter>
      <TracePanel
        workspaceId={TEST_WORKSPACE_ID}
        agentId={TEST_AGENT_ID}
        flow={TRACE_FLOW}
        run={{ id: TRACE_RUN_ID, status, createdAt: '2026-10-11T10:00:00Z', errorMessage: null }}
        turnNumber={2}
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

    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Open in flow builder' })).toHaveAttribute(
        'href',
        `/w/${TEST_WORKSPACE_ID}/agents/${TEST_AGENT_ID}?node=${REPLY_NODE_ID}`,
      ),
    );
    expect(await stepState('Send replies')).toBe('failed');
  });

  it('shows the steps a finished turn never reached', async () => {
    renderPanel(RunStatus.Succeeded, [testingRunMock(RunStatus.Succeeded, null)]);

    await waitFor(async () => expect(await stepState('Incoming message')).toBe('done'));
    expect(await stepState('Send replies')).toBe('skipped');
  });
});
