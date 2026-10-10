import { Locale } from '@agent-ic/contracts';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildAgentsMock,
  buildDuplicateAgentFailureMock,
  buildDuplicateAgentMock,
  buildResumeAgentFailureMock,
  buildResumeAgentMock,
  GIFT_CARD_FAQ,
  REVIEW_COLLECTOR,
  SALON_ASSISTANT,
} from '@/features/agents/communication/fixtures/agents.fixture';
import {
  buildWorkspaceShellMock,
  DEMO_WORKSPACE,
} from '@/features/workspace/communication/fixtures/workspaceShell.fixture';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { openAgentMenu } from '@test/support/helpers/agentMenu.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const agentsPath = `/w/${DEMO_WORKSPACE.id}/agents`;
const ALL_AGENTS = [SALON_ASSISTANT, GIFT_CARD_FAQ, REVIEW_COLLECTOR];

describe('agent row actions', () => {
  beforeEach(() => signInForTest());

  afterEach(async () => {
    setWorkspaceId(null);
    await signOutForTest();
  });

  it('offers Resume only to a paused agent and has no Rename', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE]), buildAgentsMock(ALL_AGENTS)],
    });

    const live = await openAgentMenu(user, 'Salon assistant');
    expect(within(live).getByRole('option', { name: 'Duplicate' })).toBeInTheDocument();
    expect(within(live).queryByRole('option', { name: 'Resume agent' })).not.toBeInTheDocument();
    expect(within(live).queryByRole('option', { name: /Rename/ })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');

    const paused = await openAgentMenu(user, 'Gift card FAQ');
    expect(within(paused).getByRole('option', { name: 'Resume agent' })).toBeInTheDocument();
  });

  it('opens the flow builder for the agent', async () => {
    const user = userEvent.setup();
    const { history } = renderRoute(agentsPath, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE]), buildAgentsMock(ALL_AGENTS)],
    });

    await user.click(
      within(await openAgentMenu(user, 'Salon assistant')).getByRole('option', {
        name: 'Open flow builder',
      }),
    );

    await waitFor(() =>
      expect(history.location.pathname).toBe(`${agentsPath}/${SALON_ASSISTANT.id}`),
    );
  });

  it('opens the simulator with the agent selected', async () => {
    const user = userEvent.setup();
    const { history } = renderRoute(agentsPath, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE]), buildAgentsMock(ALL_AGENTS)],
    });

    await user.click(
      within(await openAgentMenu(user, 'Salon assistant')).getByRole('option', {
        name: 'Test in simulator',
      }),
    );

    await waitFor(() => expect(history.location.pathname).toBe(`/w/${DEMO_WORKSPACE.id}/testing`));
    expect(history.location.search).toContain(SALON_ASSISTANT.id);
  });

  it('opens the simulator from the navigation with no agent in the address', async () => {
    const user = userEvent.setup();
    const { history } = renderRoute(agentsPath, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE]), buildAgentsMock(ALL_AGENTS)],
    });

    const navigation = await screen.findByRole('navigation', { name: 'Main' });
    const link = await within(navigation).findByRole('link', { name: 'Testing' });
    expect(link).toHaveAttribute('href', `/w/${DEMO_WORKSPACE.id}/testing`);

    await user.click(link);

    await waitFor(() => expect(history.location.pathname).toBe(`/w/${DEMO_WORKSPACE.id}/testing`));
    expect(history.location.search).toBe('');
  });

  it('resumes a paused agent', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildAgentsMock(ALL_AGENTS),
        buildResumeAgentMock(GIFT_CARD_FAQ.id),
      ],
    });

    await user.click(
      within(await openAgentMenu(user, 'Gift card FAQ')).getByRole('option', {
        name: 'Resume agent',
      }),
    );

    expect(await screen.findByText('Gift card FAQ is live again')).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getByText('Live · v5')).toBeInTheDocument();
  });

  it('duplicates an agent and says what the copy is called', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildAgentsMock(ALL_AGENTS),
        buildDuplicateAgentMock(SALON_ASSISTANT.id, 'Salon assistant (copy)'),
        buildAgentsMock([
          ...ALL_AGENTS,
          { ...REVIEW_COLLECTOR, id: 'agt_4', name: 'Salon assistant (copy)' },
        ]),
      ],
    });

    await user.click(
      within(await openAgentMenu(user, 'Salon assistant')).getByRole('option', {
        name: 'Duplicate',
      }),
    );

    expect(await screen.findByText('Created “Salon assistant (copy)”')).toBeInTheDocument();
    expect(
      await within(screen.getByRole('table')).findByText('Salon assistant (copy)'),
    ).toBeInTheDocument();
  });

  it('keeps the agent paused and shows a toast when resume fails', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildAgentsMock(ALL_AGENTS),
        buildResumeAgentFailureMock(GIFT_CARD_FAQ.id, new Error('offline')),
      ],
    });

    await user.click(
      within(await openAgentMenu(user, 'Gift card FAQ')).getByRole('option', {
        name: 'Resume agent',
      }),
    );

    expect(await screen.findByText(/The server cannot be reached/)).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getByText('Paused')).toBeInTheDocument();
  });

  it('adds no copy and shows a toast when duplicate fails', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildAgentsMock(ALL_AGENTS),
        buildDuplicateAgentFailureMock(SALON_ASSISTANT.id, new Error('offline')),
      ],
    });

    await user.click(
      within(await openAgentMenu(user, 'Salon assistant')).getByRole('option', {
        name: 'Duplicate',
      }),
    );

    expect(await screen.findByText(/The server cannot be reached/)).toBeInTheDocument();
    expect(within(screen.getByRole('table')).queryByText(/\(copy\)/)).not.toBeInTheDocument();
  });

  it('shows the Ukrainian strings', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      locale: Locale.Uk,
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE], {
          name: 'Pavlo',
          email: 'owner@demo-salon.example',
          locale: Locale.Uk,
        }),
        buildAgentsMock(ALL_AGENTS),
      ],
    });

    const menu = await openAgentMenu(user, 'Salon assistant', {
      trigger: 'Більше дій для',
      menu: 'Дії з агентом',
    });

    expect(within(menu).getByRole('option', { name: 'Дублювати' })).toBeInTheDocument();
    expect(within(menu).getByRole('option', { name: 'Відкрити сценарій' })).toBeInTheDocument();
  });
});
