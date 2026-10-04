import { WorkspaceRole } from '@agent-ic/contracts';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildInviteLinkMock,
  buildResetInviteLinkMock,
  INVITE_URL,
  RESET_INVITE_URL,
} from '@/features/settings/communication/fixtures/team.fixture';
import {
  buildWorkspaceShellMock,
  DEMO_WORKSPACE,
} from '@/features/workspace/communication/fixtures/workspaceShell.fixture';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const settingsPath = `/w/${DEMO_WORKSPACE.id}/settings`;
const OPERATOR_WORKSPACE = { ...DEMO_WORKSPACE, role: WorkspaceRole.Operator };

describe('team settings', () => {
  beforeEach(() => signInForTest());
  afterEach(async () => {
    setWorkspaceId(null);
    await signOutForTest();
  });

  it('opens Team for an owner and copies the invite link', async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const { router } = renderRoute(settingsPath, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE]), buildInviteLinkMock()],
    });

    await waitFor(() => expect(router.state.location.pathname).toBe(`${settingsPath}/team`));
    expect(await screen.findByText(INVITE_URL)).toBeInTheDocument();
    expect(screen.getByText('Link expires Oct 16 · 1 person joined with it')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Copy link' }));

    expect(writeText).toHaveBeenCalledWith(INVITE_URL);
    expect(await screen.findByText('Invite link copied')).toBeInTheDocument();
  });

  it('resets the invite link and shows the new one', async () => {
    renderRoute(`${settingsPath}/team`, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildInviteLinkMock(),
        buildResetInviteLinkMock(),
      ],
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Reset link' }));

    expect(await screen.findByText(RESET_INVITE_URL)).toBeInTheDocument();
  });

  it('keeps Team away from an operator', async () => {
    renderRoute(`${settingsPath}/team`, { mocks: [buildWorkspaceShellMock([OPERATOR_WORKSPACE])] });

    expect(
      await screen.findByRole('heading', { name: 'You don’t have access to Team' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Team/ })).not.toBeInTheDocument();
  });
});
