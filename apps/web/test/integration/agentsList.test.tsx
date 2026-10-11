import { Locale, WorkspaceRole } from '@agent-ic/contracts';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildAgentsFailureMock,
  buildAgentsMock,
  buildCreateAgentFailureMock,
  buildCreateAgentMock,
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
const BUILDER_WORKSPACE = { ...DEMO_WORKSPACE, role: WorkspaceRole.Builder };
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

  it('filters by the search text and offers to clear it', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE]), buildAgentsMock(ALL_AGENTS)],
    });

    await screen.findByText('Salon assistant');
    await user.type(screen.getByRole('searchbox', { name: 'Search agents' }), 'gift');

    expect(screen.getByText('Gift card FAQ')).toBeInTheDocument();
    expect(screen.queryByText('Salon assistant')).not.toBeInTheDocument();

    await user.clear(screen.getByRole('searchbox', { name: 'Search agents' }));
    await user.type(screen.getByRole('searchbox', { name: 'Search agents' }), 'zzz');

    expect(await screen.findByText('No agents match')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(await screen.findByText('Salon assistant')).toBeInTheDocument();
  });

  it('filters by status', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE]), buildAgentsMock(ALL_AGENTS)],
    });

    await screen.findByText('Salon assistant');
    await user.click(screen.getByRole('button', { name: 'Status' }));
    await user.click(
      within(screen.getByRole('dialog', { name: 'Status' })).getByRole('checkbox', {
        name: 'Paused',
      }),
    );

    expect(screen.getByText('Gift card FAQ')).toBeInTheDocument();
    expect(screen.queryByText('Salon assistant')).not.toBeInTheDocument();
    expect(screen.queryByText('Review collector')).not.toBeInTheDocument();
  });

  it('opens the builder from a row', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE]), buildAgentsMock(ALL_AGENTS)],
    });

    await user.click(await screen.findByText('Gift card FAQ'));

    expect(await screen.findByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('shows the empty state with the setup checklist to an owner', async () => {
    renderRoute(agentsPath, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE]), buildAgentsMock([])],
    });

    expect(await screen.findByText('No assistants yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Blank flow' })).toBeInTheDocument();
    expect(screen.getByText('Get set up')).toBeInTheDocument();
    expect(screen.getByText('3 steps')).toBeInTheDocument();
    const steps = screen.getByText('Create the workspace').closest('ul');
    expect(steps).not.toBeNull();
    expect(within(steps as HTMLElement).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Copy invite link' })).toHaveAttribute(
      'href',
      `/w/${DEMO_WORKSPACE.id}/settings/team`,
    );
  });

  it('leaves the invite step out for a builder', async () => {
    renderRoute(agentsPath, {
      mocks: [buildWorkspaceShellMock([BUILDER_WORKSPACE]), buildAgentsMock([])],
    });

    expect(await screen.findByText('Get set up')).toBeInTheDocument();
    expect(screen.getByText('2 steps')).toBeInTheDocument();
    expect(screen.queryByText('Invite your team')).not.toBeInTheDocument();
  });

  it('creates a blank agent and opens the builder', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildAgentsMock([]),
        buildCreateAgentMock('New agent'),
      ],
    });

    await user.click(await screen.findByRole('button', { name: 'Blank flow' }));

    expect(await screen.findByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('starts the first agent from the checklist', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildAgentsMock([]),
        buildCreateAgentMock('New agent'),
      ],
    });

    await user.click(await screen.findByRole('button', { name: 'Start' }));

    expect(await screen.findByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('creates another agent from the header', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildAgentsMock(ALL_AGENTS),
        buildCreateAgentMock('New agent'),
      ],
    });

    await user.click(await screen.findByRole('button', { name: 'New agent' }));

    expect(await screen.findByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('tells the user when the agent could not be created', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildAgentsMock([]),
        buildCreateAgentFailureMock('New agent', new Error('offline')),
      ],
    });

    await user.click(await screen.findByRole('button', { name: 'Blank flow' }));

    expect(await screen.findByText(/The server cannot be reached/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Blank flow' })).toBeInTheDocument();
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
    expect(screen.getByRole('button', { name: 'Новий агент' })).toBeInTheDocument();
  });
});
