import { AGENT_AWAY_MESSAGE_MAX_LENGTH, ErrorReason, Locale } from '@agent-ic/contracts';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildAgentsMock,
  buildPauseAgentFailureMock,
  buildPauseAgentReasonFailureMock,
  buildPauseAgentMock,
  GIFT_CARD_FAQ,
  REVIEW_COLLECTOR,
  SALON_ASSISTANT,
} from '@/features/agents/communication/fixtures/agents.fixture';
import {
  buildWorkspaceShellMock,
  DEMO_WORKSPACE,
} from '@/features/workspace/communication/fixtures/workspaceShell.fixture';
import { PauseMode } from '@/shared/api/generated/schema.generated';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { openAgentMenu } from '@test/support/helpers/agentMenu.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const agentsPath = `/w/${DEMO_WORKSPACE.id}/agents`;
const ALL_AGENTS = [SALON_ASSISTANT, GIFT_CARD_FAQ, REVIEW_COLLECTOR];
const AWAY_TEXT = 'We are closed until Monday';

const openPauseDialog = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(
    within(await openAgentMenu(user, 'Salon assistant')).getByRole('option', {
      name: /Pause agent/,
    }),
  );
  return screen.findByRole('dialog', { name: 'Pause Salon assistant?' });
};

describe('pause an agent from the row menu', () => {
  beforeEach(() => signInForTest());

  afterEach(async () => {
    setWorkspaceId(null);
    await signOutForTest();
  });

  it('offers Pause only to a live agent', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE]), buildAgentsMock(ALL_AGENTS)],
    });

    const live = await openAgentMenu(user, 'Salon assistant');
    expect(within(live).getByRole('option', { name: /Pause agent/ })).toBeInTheDocument();
    expect(within(live).getByText('stops answering')).toBeInTheDocument();
    await user.keyboard('{Escape}');

    const paused = await openAgentMenu(user, 'Gift card FAQ');
    expect(within(paused).queryByRole('option', { name: /Pause agent/ })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');

    const draft = await openAgentMenu(user, 'Review collector');
    expect(within(draft).queryByRole('option', { name: /Pause agent/ })).not.toBeInTheDocument();
  });

  it('pauses an agent to the inbox', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildAgentsMock(ALL_AGENTS),
        buildPauseAgentMock(SALON_ASSISTANT.id, PauseMode.Inbox, null),
      ],
    });

    const dialog = await openPauseDialog(user);
    expect(within(dialog).getByText('Live · v3')).toBeInTheDocument();
    expect(within(dialog).getByText(/The live version \(v3\) stays as it is/)).toBeInTheDocument();
    expect(within(dialog).queryByLabelText('Away message')).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Pause agent' }));

    expect(await screen.findByText('Salon assistant is paused')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Agents' });
    expect(within(table).queryByText('Live · v3')).not.toBeInTheDocument();
    expect(within(table).getAllByText('Paused')).toHaveLength(2);
  });

  it('asks for the away message and refuses a text over the limit', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildAgentsMock(ALL_AGENTS),
        buildPauseAgentMock(SALON_ASSISTANT.id, PauseMode.AwayMessage, AWAY_TEXT),
      ],
    });

    const dialog = await openPauseDialog(user);
    await user.click(within(dialog).getByRole('radio', { name: /Get an away message/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Pause agent' }));

    expect(
      await within(dialog).findByText('Write the away message the customer will receive.'),
    ).toBeInTheDocument();

    const field = within(dialog).getByLabelText('Away message');
    await user.click(field);
    await user.paste('a'.repeat(AGENT_AWAY_MESSAGE_MAX_LENGTH + 1));
    await user.click(within(dialog).getByRole('button', { name: 'Pause agent' }));

    expect(await within(dialog).findByText(/The away message is too long/)).toBeInTheDocument();

    await user.clear(field);
    await user.type(field, AWAY_TEXT);
    await user.click(within(dialog).getByRole('button', { name: 'Pause agent' }));

    expect(await screen.findByText('Salon assistant is paused')).toBeInTheDocument();
  });

  it('clears the away message error as soon as the text is valid', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE]), buildAgentsMock(ALL_AGENTS)],
    });

    const dialog = await openPauseDialog(user);
    await user.click(within(dialog).getByRole('radio', { name: /Get an away message/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Pause agent' }));

    const field = within(dialog).getByLabelText('Away message');
    expect(field).toHaveAttribute('aria-invalid', 'true');

    await user.type(field, AWAY_TEXT);

    expect(field).toHaveAttribute('aria-invalid', 'false');
    expect(field.className).not.toMatch(/invalid/);
    expect(
      within(dialog).queryByText('Write the away message the customer will receive.'),
    ).not.toBeInTheDocument();
  });

  it('keeps the dialog open and explains a failed pause', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildAgentsMock(ALL_AGENTS),
        buildPauseAgentFailureMock(SALON_ASSISTANT.id, PauseMode.Inbox, null, new Error('offline')),
      ],
    });

    const dialog = await openPauseDialog(user);
    await user.click(within(dialog).getByRole('button', { name: 'Pause agent' }));

    expect(await within(dialog).findByText(/The server cannot be reached/)).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Pause Salon assistant?' })).toBeInTheDocument();
  });

  it('shows the translated text of a reason the server rejects the pause with', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildAgentsMock(ALL_AGENTS),
        buildPauseAgentReasonFailureMock(
          SALON_ASSISTANT.id,
          PauseMode.AwayMessage,
          AWAY_TEXT,
          ErrorReason.AwayMessageTooLong,
        ),
      ],
    });

    const dialog = await openPauseDialog(user);
    await user.click(within(dialog).getByRole('radio', { name: /Get an away message/ }));
    await user.type(within(dialog).getByLabelText('Away message'), AWAY_TEXT);
    await user.click(within(dialog).getByRole('button', { name: 'Pause agent' }));

    expect(await within(dialog).findByText('The away message is too long.')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Pause Salon assistant?' })).toBeInTheDocument();
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
      ).getByRole('option', { name: /Призупинити агента/ }),
    );

    const dialog = await screen.findByRole('dialog', { name: 'Призупинити Salon assistant?' });
    expect(within(dialog).getByText('Працює · v3')).toBeInTheDocument();
  });
});
