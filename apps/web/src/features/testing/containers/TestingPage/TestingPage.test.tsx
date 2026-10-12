import type { MockLink } from '@apollo/client/testing';
import { createMemoryHistory } from '@tanstack/react-router';
import type { RouterHistory } from '@tanstack/react-router';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  ANSWERS,
  ESCALATION_MESSAGE,
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
} from '@/features/testing/communication/fixtures/simulator.fixture';
import {
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

  it('asks to fix a broken draft before simulating it', async () => {
    renderPage([testingAgentsMock(), testingVersionsMock(true)]);

    expect(await screen.findByText('Fix the flow first')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open in flow builder' })).toBeInTheDocument();
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

    expect(await screen.findByText('Fix the flow first')).toBeInTheDocument();
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

  it('replies as the operator after an escalation, then hands back', async () => {
    const user = userEvent.setup();
    const escalated = [ESCALATION_QUESTION, ESCALATION_MESSAGE];
    const simulation = (state: ConversationState, operator: boolean) =>
      simulationMock(
        operator ? [...escalated, OPERATOR_REPLY] : escalated,
        RunStatus.Escalated,
        null,
        state,
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
      await screen.findByRole('button', { name: `${TEST_AGENT_NAME} · Escalation message` }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Escalated · in live chats operators would be notified'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reply as operator' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Reply as operator' }),
      OPERATOR_REPLY.text,
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText('Operator')).toBeInTheDocument();

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

    await user.click(await screen.findByRole('button', { name: 'Reply as operator' }));
    await user.click(screen.getByRole('button', { name: 'Hand back' }));
    await user.click(await screen.findByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Handed back to the agent')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });
});
