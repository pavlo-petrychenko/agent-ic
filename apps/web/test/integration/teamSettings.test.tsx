import { Locale, WorkspaceRole } from '@agent-ic/contracts';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildAdminTeamMembersMock,
  buildChangeMemberRoleMock,
  buildInviteLinkMock,
  buildRemoveMemberMock,
  buildResetInviteLinkMock,
  buildTeamMembersMock,
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
const ADMIN_WORKSPACE = { ...DEMO_WORKSPACE, role: WorkspaceRole.Admin };

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
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildInviteLinkMock(),
        buildTeamMembersMock(),
      ],
    });

    await waitFor(() => expect(router.state.location.pathname).toBe(`${settingsPath}/team`));
    expect(await screen.findByText(INVITE_URL)).toBeInTheDocument();
    expect(screen.getByText('Link expires Oct 16 · 1 person joined with it')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Copy link' }));

    expect(writeText).toHaveBeenCalledWith(INVITE_URL);
    const yulia = await screen.findByRole('row', { name: /Yulia/ });
    expect(yulia).toHaveTextContent('yulia@demo-salon.example');
    expect(yulia).toHaveTextContent('Operator');
    expect(yulia).toHaveTextContent('Not yet');
    expect(await screen.findByText('Invite link copied')).toBeInTheDocument();
  });

  it('resets the invite link and shows the new one', async () => {
    renderRoute(`${settingsPath}/team`, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildInviteLinkMock(),
        buildTeamMembersMock(),
        buildResetInviteLinkMock(),
      ],
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Reset link' }));

    expect(await screen.findByText(RESET_INVITE_URL)).toBeInTheDocument();
  });

  it('removes another member from the row action', async () => {
    const user = userEvent.setup();
    renderRoute(`${settingsPath}/team`, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildInviteLinkMock(),
        buildTeamMembersMock(),
        buildRemoveMemberMock('mem_2'),
      ],
    });

    await user.click(await screen.findByRole('button', { name: 'More actions for Yulia' }));

    expect(
      await screen.findByRole('heading', { name: 'Remove Yulia from Demo salon?' }),
    ).toBeInTheDocument();
    expect(screen.getByText('yulia@demo-salon.example · Operator')).toBeInTheDocument();
    expect(screen.getByText(/loses access right away/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(await screen.findByText('Yulia was removed from Demo salon')).toBeInTheDocument();
  });

  it('opens transfer ownership from the owner own row', async () => {
    const user = userEvent.setup();
    renderRoute(`${settingsPath}/team`, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildInviteLinkMock(),
        buildTeamMembersMock(),
      ],
    });

    await user.click(await screen.findByRole('button', { name: 'More actions for Pavlo' }));

    expect(
      await screen.findByRole('heading', { name: 'Transfer ownership of Demo salon' }),
    ).toBeInTheDocument();
  });

  it('hides the owner row action from an admin and lets the admin leave', async () => {
    const user = userEvent.setup();
    renderRoute(`${settingsPath}/team`, {
      mocks: [
        buildWorkspaceShellMock([ADMIN_WORKSPACE], {
          id: 'usr_2',
          name: 'Yulia',
          email: 'yulia@demo-salon.example',
          locale: Locale.En,
        }),
        buildInviteLinkMock(),
        buildTeamMembersMock(),
      ],
    });

    const owner = await screen.findByRole('row', { name: /Pavlo/ });
    expect(within(owner).queryByRole('button')).not.toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'More actions for Yulia' }));
    expect(
      await screen.findByRole('heading', { name: 'Leave workspace - Demo salon' }),
    ).toBeInTheDocument();
  });

  it('changes a member role from the row select as the owner', async () => {
    const user = userEvent.setup();
    renderRoute(`${settingsPath}/team`, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildInviteLinkMock(),
        buildTeamMembersMock(),
        buildChangeMemberRoleMock('mem_2', 'admin'),
      ],
    });

    const owner = await screen.findByRole('row', { name: /Pavlo/ });
    expect(within(owner).queryByRole('combobox')).not.toBeInTheDocument();
    expect(within(owner).getByText('Owner')).toBeInTheDocument();

    const yulia = await screen.findByRole('row', { name: /Yulia/ });
    const select = within(yulia).getByRole('combobox', { name: 'Role for Yulia' });
    expect(
      within(select)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Admin', 'Builder', 'Operator']);

    await user.selectOptions(select, 'admin');

    expect(await screen.findByText('Yulia is now Admin')).toBeInTheDocument();
  });

  it('keeps the owner and admin roles static for an admin', async () => {
    renderRoute(`${settingsPath}/team`, {
      mocks: [
        buildWorkspaceShellMock([ADMIN_WORKSPACE], {
          id: 'usr_2',
          name: 'Yulia',
          email: 'yulia@demo-salon.example',
          locale: Locale.En,
        }),
        buildInviteLinkMock(),
        buildAdminTeamMembersMock(),
      ],
    });

    const owner = await screen.findByRole('row', { name: /Pavlo/ });
    expect(within(owner).queryByRole('combobox')).not.toBeInTheDocument();
    expect(within(owner).getByText('Owner')).toBeInTheDocument();

    const admin = await screen.findByRole('row', { name: /Yulia/ });
    expect(within(admin).queryByRole('combobox')).not.toBeInTheDocument();
    expect(within(admin).getByText('Admin')).toBeInTheDocument();

    const builder = await screen.findByRole('row', { name: /Taras/ });
    expect(within(builder).getByRole('combobox', { name: 'Role for Taras' })).toBeInTheDocument();
  });

  it('keeps Team away from an operator', async () => {
    renderRoute(`${settingsPath}/team`, { mocks: [buildWorkspaceShellMock([OPERATOR_WORKSPACE])] });

    expect(
      await screen.findByRole('heading', { name: 'You don’t have access to Team' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Team/ })).not.toBeInTheDocument();
  });
});
