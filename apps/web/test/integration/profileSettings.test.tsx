import { WorkspaceRole } from '@agent-ic/contracts';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildChangeMyPasswordMock,
  buildLeaveWorkspaceMock,
  buildRequestMyEmailChangeMock,
  buildUpdateMyNameMock,
} from '@/features/settings/communication/fixtures/profile.fixture';
import { buildRememberWorkspaceMock } from '@/features/workspace/communication/fixtures/rememberWorkspace.fixture';
import {
  buildWorkspaceShellMock,
  DEMO_WORKSPACE,
} from '@/features/workspace/communication/fixtures/workspaceShell.fixture';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { createFakeColorSchemeQuery } from '@test/support/helpers/colorScheme.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const settingsPath = `/w/${DEMO_WORKSPACE.id}/settings`;
const STUDIO_WORKSPACE = {
  id: 'ws_studio',
  name: 'Studio',
  role: WorkspaceRole.Admin,
  memberCount: 3,
};

describe('profile settings', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => createFakeColorSchemeQuery(false).query);
    signInForTest();
  });
  afterEach(async () => {
    setWorkspaceId(null);
    await signOutForTest();
    vi.unstubAllGlobals();
  });

  it('saves the account name', async () => {
    const user = userEvent.setup();
    renderRoute(`${settingsPath}/profile`, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildRememberWorkspaceMock(DEMO_WORKSPACE.id),
        buildUpdateMyNameMock('Marta New'),
      ],
    });

    const name = await screen.findByLabelText('Name');
    await user.clear(name);
    await user.type(name, 'Marta New');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Updated name successfully')).toBeInTheDocument();
  });

  it('asks for a confirmation link when the email changes', async () => {
    const user = userEvent.setup();
    renderRoute(`${settingsPath}/profile`, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildRememberWorkspaceMock(DEMO_WORKSPACE.id),
        buildRequestMyEmailChangeMock('pavlo@new-salon.example'),
      ],
    });

    const email = await screen.findByLabelText('Email');
    expect(email).toHaveValue('owner@demo-salon.example');
    await user.click(screen.getByRole('button', { name: 'Change' }));
    await user.clear(email);
    await user.type(email, 'pavlo@new-salon.example');
    await user.click(screen.getByRole('button', { name: 'Send link' }));

    expect(
      await screen.findByText(
        'We sent a confirmation link to pavlo@new-salon.example. Open it to finish the change.',
      ),
    ).toBeInTheDocument();
  });

  it('changes the password', async () => {
    const user = userEvent.setup();
    renderRoute(`${settingsPath}/profile`, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildRememberWorkspaceMock(DEMO_WORKSPACE.id),
        buildChangeMyPasswordMock('old password', 'new password 123'),
      ],
    });

    await user.type(await screen.findByLabelText('Current password'), 'old password');
    await user.type(screen.getByLabelText('New password'), 'new password 123');
    await user.click(screen.getByRole('button', { name: 'Change password' }));

    expect(await screen.findByText('Changed password successfully')).toBeInTheDocument();
  });

  it('lists the workspaces and leaves another one', async () => {
    const user = userEvent.setup();
    renderRoute(`${settingsPath}/profile`, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE, STUDIO_WORKSPACE]),
        buildRememberWorkspaceMock(DEMO_WORKSPACE.id),
        buildLeaveWorkspaceMock(STUDIO_WORKSPACE.id),
      ],
    });

    expect(await screen.findByRole('heading', { name: 'Your workspaces' })).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();

    const studio = screen
      .getAllByRole('listitem')
      .find((row) => within(row).queryByText('Studio') !== null);
    if (studio === undefined) {
      throw new Error('Studio workspace row is missing');
    }
    await user.click(within(studio).getByRole('button', { name: 'Leave' }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Leave workspace - Studio' }),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Leave workspace' }));

    expect(await screen.findByText('You left workspace')).toBeInTheDocument();
  });
});
