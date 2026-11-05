import type { MockLink } from '@apollo/client/testing';
import { createMemoryHistory } from '@tanstack/react-router';
import type { RouterHistory } from '@tanstack/react-router';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  ANSWERS,
  ESCALATION_MESSAGE,
  ESCALATION_STEP,
  ESCALATION_QUESTION,
  OPERATOR_REPLY,
  QUESTION,
  failedHandBackMock,
  handBackMock,
  replyAsOperatorMock,
  restartSimulationMock,
  sendSimulatorMessageMock,
  simulationMock,
  startSimulationMock,
  TEST_RUN_ID,
  FOLLOW_UP,
  busyScheduleMock,
  closeForInactivityMock,
  failedCloseForInactivityMock,
  followUpSimulationMock,
  refusedSilenceMock,
  runScheduleMock,
  scheduledSimulationMock,
  simulateSilenceMock,
} from '@/features/testing/communication/fixtures/simulator.fixture';
import {
  AUTO_CLOSE_FLOW,
  FOLLOW_UP_FLOW,
  REPLY_NODE_ID,
  SCHEDULE_FLOW,
  SCHEDULE_NAME,
  SCHEDULE_NODE_ID,
  TEST_AGENT_ID,
  TEST_AGENT_NAME,
  TEST_WORKSPACE_ID,
  failedTestingVersionsMock,
  testingAgentsMock,
  testingVersionsMock,
} from '@/features/testing/communication/fixtures/testing.fixture';
import { testingRunMock } from '@/features/testing/communication/fixtures/trace.fixture';
import { TestingPage } from '@/features/testing/containers/TestingPage/TestingPage';
import {
  ConversationCloseReason,
  ConversationState,
  RunStatus,
  RunStepStatus,
} from '@/shared/api/generated/schema.generated';
import { MemoryRouter } from '@test/support/components/MemoryRouter';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const renderPage = (
  mocks: readonly MockLink.MockedResponse[],
  history: RouterHistory | null = null,
) =>
  renderWithProviders(
    <MemoryRouter history={history}>
      <TestingPage workspaceId={TEST_WORKSPACE_ID} agentId={TEST_AGENT_ID} />
    </MemoryRouter>,
    { mocks },
  );

describe('TestingPage', () => {
  it('offers the draft and the published versions of the agent', async () => {
    const user = userEvent.setup();
    renderPage([
      testingAgentsMock(),
      testingVersionsMock(),
      startSimulationMock(),
      simulationMock([], null),
    ]);

    await user.click(await screen.findByRole('button', { name: /Version\s+Draft v4/ }));

    expect(screen.getByRole('button', { name: /Agent\s+Salon assistant/ })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: /v3/ })).toBeInTheDocument();
  });

  it('names a draft with no changes after the live version', async () => {
    const user = userEvent.setup();
    renderPage([
      testingAgentsMock(),
      testingVersionsMock(false, 0),
      startSimulationMock(),
      simulationMock([], null),
    ]);

    await user.click(await screen.findByRole('button', { name: /Version\s+Same as v3/ }));

    expect(screen.getByRole('option', { name: /Same as v3/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Draft v4/ })).not.toBeInTheDocument();
  });

  it('keeps the draft name when it has changes', async () => {
    renderPage([
      testingAgentsMock(),
      testingVersionsMock(false, 2),
      startSimulationMock(),
      simulationMock([], null),
    ]);

    expect(await screen.findByRole('button', { name: /Version\s+Draft v4/ })).toBeInTheDocument();
    expect(screen.queryByText(/Same as/)).not.toBeInTheDocument();
  });

  it('keeps the agent when switching to the Versions tab', async () => {
    const user = userEvent.setup();
    const history = createMemoryHistory();
    renderPage(
      [testingAgentsMock(), testingVersionsMock(), startSimulationMock(), simulationMock([], null)],
      history,
    );

    await screen.findByRole('button', { name: /Agent\s+Salon assistant/ });
    await user.click(screen.getByRole('tab', { name: 'Versions' }));

    await vi.waitFor(() =>
      expect(history.location.href).toBe(
        `/w/${TEST_WORKSPACE_ID}/testing/versions?agent=${TEST_AGENT_ID}`,
      ),
    );
  });

  it('asks to create an agent when there is nothing to simulate', async () => {
    renderPage([testingAgentsMock([])]);

    expect(await screen.findByText('Nothing to simulate yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create an agent' })).toBeInTheDocument();
  });

  it('offers a retry when the versions fail to load', async () => {
    const user = userEvent.setup();
    renderPage([testingAgentsMock(), failedTestingVersionsMock, testingVersionsMock()]);

    expect(await screen.findByText("Couldn't load the simulator")).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('button', { name: /Version\s+Draft v4/ })).toBeInTheDocument();
  });

  it('names the first blocking issue of a broken draft and opens its step', async () => {
    const user = userEvent.setup();
    const history = createMemoryHistory();
    renderPage([testingAgentsMock(), testingVersionsMock(true)], history);

    expect(await screen.findByText('Fix the flow first: Send replies')).toBeInTheDocument();
    expect(
      screen.getByText(/^Write a prompt\. The simulator can’t run Draft v4/),
    ).toBeInTheDocument();
    expect(screen.getByText('1 more issue')).toBeInTheDocument();
    expect(screen.getByText('Add a trigger to start the flow')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open in flow builder' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open Send replies' }));

    await vi.waitFor(() =>
      expect(history.location.href).toBe(
        `/w/${TEST_WORKSPACE_ID}/agents/${TEST_AGENT_ID}?node=${REPLY_NODE_ID}`,
      ),
    );
  });

  it('groups the bot messages per turn and marks the latest turn', async () => {
    renderPage([
      testingAgentsMock(),
      testingVersionsMock(),
      startSimulationMock(),
      simulationMock([QUESTION, ...ANSWERS]),
    ]);

    const turn = await screen.findByRole('button', { name: `${TEST_AGENT_NAME} · 2 messages` });

    expect(turn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(QUESTION.text)).toBeInTheDocument();
    expect(screen.getByText('Anything else?')).toBeInTheDocument();
  });

  it('goes back to the whole turn when its header in the chat is clicked', async () => {
    const user = userEvent.setup();
    renderPage([
      testingAgentsMock(),
      testingVersionsMock(),
      startSimulationMock(),
      simulationMock([QUESTION, ...ANSWERS]),
      testingRunMock(RunStatus.Succeeded, RunStepStatus.Succeeded, undefined, TEST_RUN_ID),
    ]);
    const details = await screen.findByRole('complementary', { name: 'Turn details' });

    await user.click(await screen.findByRole('button', { name: 'Send replies ran' }));
    expect(within(details).getByRole('heading', { name: 'Input' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: `${TEST_AGENT_NAME} · 2 messages` }));

    expect(within(details).getByRole('heading', { name: 'Turn 1' })).toBeInTheDocument();
    expect(within(details).queryByRole('heading', { name: 'Input' })).not.toBeInTheDocument();
  });

  it('shows the typing indicator while a turn runs', async () => {
    renderPage([
      testingAgentsMock(),
      testingVersionsMock(),
      startSimulationMock(),
      simulationMock([QUESTION], RunStatus.Running),
    ]);

    expect(await screen.findByText(`${TEST_AGENT_NAME} is typing…`)).toBeInTheDocument();
  });

  it('reloads the draft when a new turn starts', async () => {
    const user = userEvent.setup();
    renderPage([
      testingAgentsMock(),
      testingVersionsMock(),
      startSimulationMock(),
      simulationMock([], null),
      sendSimulatorMessageMock(QUESTION.text),
      simulationMock([QUESTION], RunStatus.Running),
      testingVersionsMock(true),
    ]);

    await screen.findByText('Say hi to your agent');
    await user.type(
      screen.getByRole('textbox', { name: 'Message as the test user' }),
      QUESTION.text,
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText('Fix the flow first: Send replies')).toBeInTheDocument();
  });

  it('sends a message as the test user and resets the conversation', async () => {
    const user = userEvent.setup();
    renderPage([
      testingAgentsMock(),
      testingVersionsMock(),
      startSimulationMock(),
      simulationMock([], null),
      sendSimulatorMessageMock(QUESTION.text),
      simulationMock([QUESTION], null),
      restartSimulationMock,
      simulationMock([], null),
    ]);

    expect(await screen.findByText('Say hi to your agent')).toBeInTheDocument();
    await user.type(
      screen.getByRole('textbox', { name: 'Message as the test user' }),
      QUESTION.text,
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));
    const chat = await screen.findByRole('list', { name: 'Test conversation' });
    expect(within(chat).getByText(QUESTION.text)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reset conversation' }));

    expect(await screen.findByText('Say hi to your agent')).toBeInTheDocument();
    expect(chat).not.toBeInTheDocument();
  });

  it('keeps a conversation the agent ended and starts a new one', async () => {
    const user = userEvent.setup();
    renderPage([
      testingAgentsMock(),
      testingVersionsMock(),
      startSimulationMock(),
      simulationMock([QUESTION, ...ANSWERS], RunStatus.Succeeded, null, ConversationState.Closed),
      restartSimulationMock,
      simulationMock([], null),
    ]);

    const chat = await screen.findByRole('list', { name: 'Test conversation' });
    expect(within(chat).getByText(QUESTION.text)).toBeInTheDocument();
    expect(within(chat).getByText('Ended by the agent')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reset conversation' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Start new conversation' }));

    expect(await screen.findByText('Say hi to your agent')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Message as the test user' })).toBeInTheDocument();
  });

  it('replies as the operator after an escalation, then hands back', async () => {
    const user = userEvent.setup();
    const escalated = [ESCALATION_QUESTION, ESCALATION_MESSAGE];
    const simulation = (state: ConversationState, operator: boolean) =>
      simulationMock(
        operator ? [...escalated, OPERATOR_REPLY] : escalated,
        RunStatus.Escalated,
        null,
        state,
        [ESCALATION_STEP],
      );
    renderPage([
      testingAgentsMock(),
      testingVersionsMock(),
      startSimulationMock(),
      simulation(ConversationState.Waiting, false),
      replyAsOperatorMock(OPERATOR_REPLY.text),
      simulation(ConversationState.Handled, true),
      handBackMock,
      simulation(ConversationState.AgentActive, true),
    ]);

    expect(
      await screen.findByRole('button', { name: `${TEST_AGENT_NAME} · 1 message` }),
    ).toBeInTheDocument();
    expect(screen.getByText('Escalation message')).toBeInTheDocument();
    expect(screen.getByText(/^Escalated · \d/)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Customer' })).toBeChecked();

    await user.click(screen.getByRole('radio', { name: 'Operator' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Reply as operator' }),
      OPERATOR_REPLY.text,
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText(/^You took over · \d/)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Operator' })).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Hand back' }));

    expect(await screen.findByText('Handed back to the agent')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Message as the test user' })).toBeInTheDocument();
  });

  it('retries a failed hand back instead of sending the reply', async () => {
    const user = userEvent.setup();
    const escalated = [ESCALATION_QUESTION, ESCALATION_MESSAGE];
    renderPage([
      testingAgentsMock(),
      testingVersionsMock(),
      startSimulationMock(),
      simulationMock(escalated, RunStatus.Escalated, null, ConversationState.Waiting),
      failedHandBackMock,
      handBackMock,
      simulationMock(escalated, RunStatus.Escalated, null, ConversationState.AgentActive),
    ]);

    await user.click(await screen.findByRole('radio', { name: 'Operator' }));
    await user.click(screen.getByRole('button', { name: 'Hand back' }));
    await user.click(await screen.findByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Handed back to the agent')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('writes as the customer while the chat waits for a person', async () => {
    const user = userEvent.setup();
    const escalated = [ESCALATION_QUESTION, ESCALATION_MESSAGE];
    const waiting = (messages: typeof escalated) =>
      simulationMock(messages, RunStatus.Escalated, null, ConversationState.Waiting, [
        ESCALATION_STEP,
      ]);
    renderPage([
      testingAgentsMock(),
      testingVersionsMock(),
      startSimulationMock(),
      waiting(escalated),
      sendSimulatorMessageMock(QUESTION.text),
      waiting([...escalated, { ...QUESTION, createdAt: '2026-10-11T10:00:04Z' }]),
    ]);

    await screen.findByText(/^Escalated · \d/);
    expect(screen.getByText(/^Waiting for a person\./)).toBeInTheDocument();
    await user.type(
      screen.getByRole('textbox', { name: 'Message as the test user' }),
      QUESTION.text,
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));

    const chat = await screen.findByRole('list', { name: 'Test conversation' });
    expect(await within(chat).findByText(QUESTION.text)).toBeInTheDocument();
    expect(screen.queryByText(/^You took over/)).not.toBeInTheDocument();
  });

  it('closes the chat when inactivity is simulated with auto-close on', async () => {
    const user = userEvent.setup();
    renderPage([
      testingAgentsMock(),
      testingVersionsMock(false, 3, AUTO_CLOSE_FLOW),
      startSimulationMock(),
      simulationMock([QUESTION, ...ANSWERS]),
      closeForInactivityMock,
      simulationMock(
        [QUESTION, ...ANSWERS],
        RunStatus.Succeeded,
        null,
        ConversationState.Closed,
        [],
        ConversationCloseReason.Inactivity,
      ),
    ]);

    expect(
      await screen.findByText('Next: auto-close after 1 day of silence (Flow settings)'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Simulate inactivity' }));

    expect(await screen.findByText(/^Closed after inactivity · /)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start new conversation' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reset conversation' })).not.toBeInTheDocument();
  });

  it('shows why inactivity could not be simulated', async () => {
    const user = userEvent.setup();
    renderPage([
      testingAgentsMock(),
      testingVersionsMock(false, 3, AUTO_CLOSE_FLOW),
      startSimulationMock(),
      simulationMock([QUESTION, ...ANSWERS]),
      failedCloseForInactivityMock,
    ]);

    await user.click(await screen.findByRole('button', { name: 'Simulate inactivity' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Closing inactive conversations is off for this version.',
    );
  });

  it('offers no inactivity shortcut when auto-close is off', async () => {
    renderPage([
      testingAgentsMock(),
      testingVersionsMock(),
      startSimulationMock(),
      simulationMock([QUESTION, ...ANSWERS]),
    ]);

    await screen.findByRole('list', { name: 'Test conversation' });

    expect(screen.queryByRole('button', { name: 'Simulate inactivity' })).not.toBeInTheDocument();
  });

  it('fires the inactivity trigger first when it is due before auto-close', async () => {
    const user = userEvent.setup();
    renderPage([
      testingAgentsMock(),
      testingVersionsMock(false, 3, FOLLOW_UP_FLOW),
      startSimulationMock(),
      simulationMock([QUESTION, ...ANSWERS]),
      simulateSilenceMock,
      followUpSimulationMock,
    ]);

    expect(
      await screen.findByText('Next: inactivity follow-up 1 after 2 hours of silence'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Simulate inactivity' }));

    expect(await screen.findByText(/^2 hours of silence simulated · /)).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: `${TEST_AGENT_NAME} · inactivity follow-up 1 · 1 message`,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(FOLLOW_UP.text)).toBeInTheDocument();
    expect(
      screen.getByText('Next: auto-close after 1 day of silence (Flow settings)'),
    ).toBeInTheDocument();
  });

  it('says which condition stopped a simulated follow-up', async () => {
    const user = userEvent.setup();
    renderPage([
      testingAgentsMock(),
      testingVersionsMock(false, 3, FOLLOW_UP_FLOW),
      startSimulationMock(),
      simulationMock([QUESTION, ...ANSWERS]),
      refusedSilenceMock,
    ]);

    await user.click(await screen.findByRole('button', { name: 'Simulate inactivity' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The trigger skips chats that were escalated.',
    );
  });

  it('runs a schedule now and shows its condition checks', async () => {
    const user = userEvent.setup();
    renderPage([
      testingAgentsMock(),
      testingVersionsMock(false, 3, SCHEDULE_FLOW),
      startSimulationMock(),
      simulationMock([QUESTION, ...ANSWERS]),
      runScheduleMock(SCHEDULE_NODE_ID),
      scheduledSimulationMock,
    ]);

    await user.click(await screen.findByRole('tab', { name: 'Schedule' }));
    expect(await screen.findByRole('combobox', { name: 'Start with' })).toHaveValue(
      SCHEDULE_NODE_ID,
    );
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Run schedule now' }));

    const checks = await screen.findByRole('list', { name: 'Schedule conditions' });
    expect(within(checks).getByText('The customer wrote at least once')).toBeInTheDocument();
    expect(within(checks).getByText('Silent for at least 24 h')).toBeInTheDocument();
    expect(within(checks).getByText('not met')).toBeInTheDocument();
    expect(await screen.findByText(/^Schedule run now · /)).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: `${TEST_AGENT_NAME} · Scheduled · ${SCHEDULE_NAME} · 1 message`,
      }),
    ).toBeInTheDocument();
  });

  it('shows why a schedule could not run', async () => {
    const user = userEvent.setup();
    renderPage([
      testingAgentsMock(),
      testingVersionsMock(false, 3, SCHEDULE_FLOW),
      startSimulationMock(),
      simulationMock([QUESTION, ...ANSWERS]),
      busyScheduleMock(SCHEDULE_NODE_ID),
    ]);

    await user.click(await screen.findByRole('tab', { name: 'Schedule' }));
    await user.click(await screen.findByRole('button', { name: 'Run schedule now' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The agent is still answering. Try again when it finishes.',
    );
  });

  it('asks for a customer message before a schedule can run', async () => {
    const user = userEvent.setup();
    renderPage([
      testingAgentsMock(),
      testingVersionsMock(false, 3, SCHEDULE_FLOW),
      startSimulationMock(),
      simulationMock([], null),
    ]);

    await user.click(await screen.findByRole('tab', { name: 'Schedule' }));

    expect(await screen.findByRole('button', { name: 'Run schedule now' })).toBeDisabled();
    expect(screen.getByText('Send one message as the customer first.')).toBeInTheDocument();
  });

  it('offers no schedule tab when the flow has no schedule trigger', async () => {
    renderPage([
      testingAgentsMock(),
      testingVersionsMock(),
      startSimulationMock(),
      simulationMock([QUESTION, ...ANSWERS]),
    ]);

    await screen.findByRole('list', { name: 'Test conversation' });

    expect(screen.queryByRole('tab', { name: 'Schedule' })).not.toBeInTheDocument();
  });
});
