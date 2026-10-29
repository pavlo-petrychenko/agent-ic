import type { MockLink } from '@apollo/client/testing';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  AGENT_EXIT_FLOW,
  AGENT_TRACE_FLOW,
  ESCALATION_TRACE_FLOW,
  REPLY_NODE_ID,
  TEST_AGENT_ID,
  TEST_WORKSPACE_ID,
  TRACE_FLOW,
} from '@/features/testing/communication/fixtures/testing.fixture';
import {
  ESCALATION_OUTPUT,
  STEP_ERROR,
  TRACE_RUN_ID,
  testingRunMock,
} from '@/features/testing/communication/fixtures/trace.fixture';
import { TurnOutcome } from '@/features/testing/constants/trace.constants';
import { TracePanel } from '@/features/testing/containers/TracePanel/TracePanel';
import { useNodeInspection } from '@/features/testing/logic/hooks/useNodeInspection';
import { RunStatus, RunStepStatus } from '@/shared/api/generated/schema.generated';
import { MemoryRouter } from '@test/support/components/MemoryRouter';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

interface PanelEnding {
  closing: TurnOutcome | null;
  texts: readonly string[];
  escalationMessageCount: number;
}

interface InspectablePanelProps {
  status: RunStatus;
  draft: boolean;
  flow: typeof TRACE_FLOW;
  handedBack: boolean;
  ending: PanelEnding;
}

const NO_ENDING: PanelEnding = { closing: null, texts: [], escalationMessageCount: 0 };

function InspectablePanel({ status, draft, flow, handedBack, ending }: InspectablePanelProps) {
  const { selectedNodeId, selectNode } = useNodeInspection(TRACE_RUN_ID);

  return (
    <TracePanel
      workspaceId={TEST_WORKSPACE_ID}
      agentId={TEST_AGENT_ID}
      flow={flow}
      run={{
        id: TRACE_RUN_ID,
        status,
        createdAt: '2026-10-11T10:00:00Z',
        finishedAt: null,
        errorMessage: null,
        escalationMessageCount: ending.escalationMessageCount,
        escalatedByStep: false,
      }}
      turnNumber={2}
      handedBack={handedBack}
      closing={ending.closing}
      texts={ending.texts}
      draft={draft}
      liveNumber={3}
      selectedNodeId={selectedNodeId}
      onSelectNode={selectNode}
    />
  );
}

const renderPanel = (
  status: RunStatus,
  mocks: readonly MockLink.MockedResponse[],
  draft = true,
  flow = TRACE_FLOW,
  handedBack = false,
  ending = NO_ENDING,
) =>
  renderWithProviders(
    <MemoryRouter>
      <InspectablePanel
        status={status}
        draft={draft}
        flow={flow}
        handedBack={handedBack}
        ending={ending}
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

  it('shows who an escalation would notify and that the flow paused', async () => {
    renderPanel(
      RunStatus.Escalated,
      [testingRunMock(RunStatus.Escalated, RunStepStatus.Succeeded, ESCALATION_OUTPUT)],
      true,
      ESCALATION_TRACE_FLOW,
    );

    expect(await screen.findByText('Pavlo, Oksana')).toBeInTheDocument();
    expect(screen.getByText('Escalated')).toBeInTheDocument();
    expect(screen.getByText('Would notify')).toBeInTheDocument();
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('reads an escalation without raw JSON: mode, reason, recipients and the message sent', async () => {
    renderPanel(
      RunStatus.Escalated,
      [testingRunMock(RunStatus.Escalated, RunStepStatus.Succeeded, ESCALATION_OUTPUT)],
      true,
      ESCALATION_TRACE_FLOW,
      false,
      { closing: null, texts: ['Got it.', 'Bringing in our manager.'], escalationMessageCount: 1 },
    );
    const details = await screen.findByRole('complementary', { name: 'Turn details' });

    expect(
      await within(details).findByRole('heading', { name: 'Exit · Hand off to a person' }),
    ).toBeInTheDocument();
    expect(within(details).getByText('Escalate to a person')).toBeInTheDocument();
    expect(within(details).getByText('Asks for a manager')).toBeInTheDocument();
    expect(within(details).getByText('Operators group')).toBeInTheDocument();
    expect(within(details).getByText('Bringing in our manager.')).toBeInTheDocument();
    expect(within(details).queryByText('Got it.')).not.toBeInTheDocument();
    expect(within(details).queryByText(/messageIds/)).not.toBeInTheDocument();
  });

  it('reads the default exit an agent took and says the chat ended', async () => {
    renderPanel(
      RunStatus.Succeeded,
      [
        testingRunMock(RunStatus.Succeeded, RunStepStatus.Succeeded, {
          messages: ['See you on Friday!'],
          outcome: 'handoff',
          outcome_reason: 'Wants a refund',
        }),
      ],
      true,
      AGENT_TRACE_FLOW,
      false,
      { ...NO_ENDING, closing: TurnOutcome.Ended },
    );
    const details = await screen.findByRole('complementary', { name: 'Turn details' });

    expect(await within(details).findByText('Hand off to a person')).toBeInTheDocument();
    expect(within(details).getByText('Wants a refund')).toBeInTheDocument();
    expect(within(details).getByText('Default exit · flow settings hand-off')).toBeInTheDocument();
    expect(within(details).getByText('See you on Friday!')).toBeInTheDocument();
    expect(within(details).getByText('Ended')).toBeInTheDocument();
    expect(within(details).queryByText('Completed')).not.toBeInTheDocument();
  });

  it('explains a chat that auto-close closed after the turn', async () => {
    renderPanel(
      RunStatus.Succeeded,
      [testingRunMock(RunStatus.Succeeded, null)],
      true,
      AGENT_EXIT_FLOW,
      false,
      { ...NO_ENDING, closing: TurnOutcome.ClosedInactive },
    );
    const details = await screen.findByRole('complementary', { name: 'Turn details' });

    expect(await within(details).findByText('Closed (inactive)')).toBeInTheDocument();
    expect(
      within(details).getByRole('heading', { name: 'Exit · Flow settings' }),
    ).toBeInTheDocument();
    expect(within(details).getByText('1 day without a customer message')).toBeInTheDocument();
    expect(within(details).getByText('None — closes silently')).toBeInTheDocument();
  });

  it('follows the conversation after a hand back', async () => {
    renderPanel(
      RunStatus.Escalated,
      [testingRunMock(RunStatus.Escalated, RunStepStatus.Succeeded, ESCALATION_OUTPUT)],
      true,
      ESCALATION_TRACE_FLOW,
      true,
    );

    expect(await screen.findByText('Resumed')).toBeInTheDocument();
    expect(screen.getByText('Handed back')).toBeInTheDocument();
    expect(screen.queryByText('Paused')).not.toBeInTheDocument();
    expect(screen.queryByText('Escalated')).not.toBeInTheDocument();
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

  it('shows the input and the error of a failed step picked in the trace', async () => {
    const user = userEvent.setup();
    renderPanel(RunStatus.Failed, [testingRunMock(RunStatus.Failed, RunStepStatus.Failed)]);
    const details = await screen.findByRole('complementary', { name: 'Turn details' });

    await user.click(await screen.findByRole('button', { name: 'Send replies failed' }));

    expect(screen.getByRole('button', { name: 'Send replies failed' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(details).getByRole('heading', { name: 'Send replies' })).toBeInTheDocument();
    expect(within(details).getByRole('heading', { name: 'Input' })).toBeInTheDocument();
    expect(within(details).getByText('simulated')).toBeInTheDocument();
    expect(within(details).queryByRole('heading', { name: 'Output' })).not.toBeInTheDocument();
    expect(within(details).getByText(STEP_ERROR)).toBeInTheDocument();
    expect(within(details).getByRole('link', { name: 'Open in flow builder' })).toHaveAttribute(
      'href',
      `/w/${TEST_WORKSPACE_ID}/agents/${TEST_AGENT_ID}?node=${REPLY_NODE_ID}`,
    );
  });

  it('shows the output of a step picked with the keyboard and goes back to the turn', async () => {
    const user = userEvent.setup();
    renderPanel(RunStatus.Succeeded, [testingRunMock(RunStatus.Succeeded, null)]);
    const details = await screen.findByRole('complementary', { name: 'Turn details' });

    (await screen.findByRole('button', { name: 'Incoming message ran' })).focus();
    await user.keyboard('{Enter}');

    expect(within(details).getByRole('heading', { name: 'Output' })).toBeInTheDocument();
    expect(within(details).getByText('needs_human')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Send replies/ })).not.toBeInTheDocument();

    await user.click(within(details).getByRole('button', { name: 'All steps of turn 2' }));

    expect(within(details).getByRole('heading', { name: 'Turn 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Incoming message ran' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
