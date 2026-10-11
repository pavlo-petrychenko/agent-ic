import { Locale } from '@agent-ic/contracts';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildAgentsMock,
  buildDeleteAgentFailureMock,
  buildDeleteAgentMock,
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

describe('delete an agent from the row menu', () => {
  beforeEach(() => signInForTest());

  afterEach(async () => {
    setWorkspaceId(null);
    await signOutForTest();
  });

  it('deletes a live agent only after its name is typed, and shows the version count', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildAgentsMock(ALL_AGENTS),
        buildDeleteAgentMock(SALON_ASSISTANT.id),
        buildAgentsMock([GIFT_CARD_FAQ, REVIEW_COLLECTOR]),
      ],
    });

    await user.click(
      within(await openAgentMenu(user, 'Salon assistant')).getByRole('option', {
        name: 'Delete agent',
      }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Delete Salon assistant?' });
    const impact = within(within(dialog).getByRole('list')).getAllByRole('listitem');
    expect(impact.map((row) => row.textContent)).toEqual([
      'Flow and 4 versionsdeleted',
      'Past conversationskept',
    ]);
    const submit = within(dialog).getByRole('button', { name: 'Delete agent' });
    expect(submit).toBeDisabled();

    await user.type(within(dialog).getByLabelText('Agent name'), 'Salon assist');
    expect(submit).toBeDisabled();

    await user.type(within(dialog).getByLabelText('Agent name'), 'ant');
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(await screen.findByText('Salon assistant was deleted')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        within(screen.getByRole('table')).queryByText('Salon assistant'),
      ).not.toBeInTheDocument(),
    );
  });

  it('leaves the agent in place when the dialog is cancelled', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE]), buildAgentsMock(ALL_AGENTS)],
    });

    await user.click(
      within(await openAgentMenu(user, 'Gift card FAQ')).getByRole('option', {
        name: 'Delete agent',
      }),
    );
    await user.click(
      within(await screen.findByRole('dialog', { name: 'Delete Gift card FAQ?' })).getByRole(
        'button',
        { name: 'Cancel' },
      ),
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(within(screen.getByRole('table')).getByText('Gift card FAQ')).toBeInTheDocument();
  });

  it('keeps the dialog open and explains a failed delete', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildAgentsMock(ALL_AGENTS),
        buildDeleteAgentFailureMock(REVIEW_COLLECTOR.id, new Error('offline')),
      ],
    });

    await user.click(
      within(await openAgentMenu(user, 'Review collector')).getByRole('option', {
        name: 'Delete agent',
      }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Delete Review collector?' });
    expect(within(dialog).getByText('Flow, never published')).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText('Agent name'), 'Review collector');
    await user.click(within(dialog).getByRole('button', { name: 'Delete agent' }));

    expect(await within(dialog).findByText(/The server cannot be reached/)).toBeInTheDocument();
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

    await user.click(
      within(
        await openAgentMenu(user, 'Salon assistant', {
          trigger: 'Більше дій для',
          menu: 'Дії з агентом',
        }),
      ).getByRole('option', { name: 'Видалити агента' }),
    );

    expect(
      await screen.findByRole('dialog', { name: 'Видалити Salon assistant?' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Сценарій і 4 версії')).toBeInTheDocument();
  });
});
