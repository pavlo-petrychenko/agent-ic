import { Locale } from '@agent-ic/contracts';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildAgentsFailureMock,
  buildAgentsMock,
  GIFT_CARD_FAQ,
  REVIEW_COLLECTOR,
  SALON_ASSISTANT,
} from '@/features/agents/communication/fixtures/agents.fixture';
import {
  buildWorkspaceShellMock,
  DEMO_WORKSPACE,
} from '@/features/workspace/communication/fixtures/workspaceShell.fixture';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const agentsPath = `/w/${DEMO_WORKSPACE.id}/agents`;
const ALL_AGENTS = [SALON_ASSISTANT, GIFT_CARD_FAQ, REVIEW_COLLECTOR];

describe('agents list', () => {
  beforeEach(() => signInForTest());

  afterEach(async () => {
    setWorkspaceId(null);
    await signOutForTest();
  });

  it('lists agents with their description and status lines', async () => {
    renderRoute(agentsPath, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE]), buildAgentsMock(ALL_AGENTS)],
    });

    const table = await screen.findByRole('table', { name: 'Agents' });

    expect(await within(table).findByText('Salon assistant')).toBeInTheDocument();
    expect(
      within(table).getByText('Answers questions about services, prices and hours'),
    ).toBeInTheDocument();
    expect(within(table).getByText('Live · v3')).toBeInTheDocument();
    expect(within(table).getByText('Draft v4 in progress')).toBeInTheDocument();
    expect(within(table).getByText('Paused')).toBeInTheDocument();
    expect(within(table).getByText('Never published')).toBeInTheDocument();
  });

  it('opens the builder from a row', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE]), buildAgentsMock(ALL_AGENTS)],
    });

    await user.click(await screen.findByText('Gift card FAQ'));

    expect(await screen.findByRole('heading', { name: 'Flow builder' })).toBeInTheDocument();
  });

  it('shows the empty state when there are no agents', async () => {
    renderRoute(agentsPath, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE]), buildAgentsMock([])],
    });

    expect(await screen.findByText('No agents yet')).toBeInTheDocument();
  });

  it('explains a failed load and loads again on retry', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildAgentsFailureMock(new Error('offline')),
        buildAgentsMock(ALL_AGENTS),
      ],
    });

    expect(await screen.findByText('The agents could not be loaded.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Salon assistant')).toBeInTheDocument();
  });

  it('loads the next page', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildAgentsMock([SALON_ASSISTANT], { hasNextPage: true }),
        buildAgentsMock([GIFT_CARD_FAQ], { after: `cursor_${SALON_ASSISTANT.id}` }),
      ],
    });

    await user.click(await screen.findByRole('button', { name: 'Load more' }));

    expect(await screen.findByText('Gift card FAQ')).toBeInTheDocument();
    expect(screen.getByText('Salon assistant')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('tells the user when the next page fails to load', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildAgentsMock([SALON_ASSISTANT], { hasNextPage: true }),
        buildAgentsFailureMock(new Error('offline'), `cursor_${SALON_ASSISTANT.id}`),
      ],
    });

    await user.click(await screen.findByRole('button', { name: 'Load more' }));

    expect(await screen.findByText(/The server cannot be reached/)).toBeInTheDocument();
  });

  it('shows the Ukrainian strings', async () => {
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

    expect(await screen.findByText('Працює · v3')).toBeInTheDocument();
    expect(screen.getByText('Чернетка v4 у роботі')).toBeInTheDocument();
    expect(screen.getByText('Ще не опубліковано')).toBeInTheDocument();
  });
});
