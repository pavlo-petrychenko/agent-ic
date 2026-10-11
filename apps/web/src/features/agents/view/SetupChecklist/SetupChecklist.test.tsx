import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SetupChecklist } from '@/features/agents/view/SetupChecklist/SetupChecklist';
import { SetupInviteAction } from '@/features/agents/view/SetupChecklist/SetupChecklist.constants';
import type {
  SetupChecklistProps,
  SetupInvite,
} from '@/features/agents/view/SetupChecklist/SetupChecklist.typedefs';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const TEAM_HREF = '/w/ws_1/settings/team';

const inviteFor = (action: SetupInviteAction): SetupInvite => ({
  action,
  teamHref: TEAM_HREF,
  loading: false,
});

const renderChecklist = (props: Partial<SetupChecklistProps> = {}) => {
  const onCopyInvite = vi.fn<() => void>();
  const onOpenTeam = vi.fn<() => void>();
  renderWithProviders(
    <SetupChecklist
      creating={false}
      invite={null}
      onStart={vi.fn<() => void>()}
      onCopyInvite={onCopyInvite}
      onOpenTeam={onOpenTeam}
      {...props}
    />,
  );
  return { onCopyInvite, onOpenTeam };
};

describe('SetupChecklist', () => {
  it('copies the invite link from its step', async () => {
    const { onCopyInvite, onOpenTeam } = renderChecklist({
      invite: inviteFor(SetupInviteAction.Copy),
    });

    await userEvent.click(screen.getByRole('button', { name: 'Copy invite link' }));

    expect(onCopyInvite).toHaveBeenCalledTimes(1);
    expect(onOpenTeam).not.toHaveBeenCalled();
    expect(screen.getByText('3 steps')).toBeInTheDocument();
  });

  it('sends the member to the team settings when there is no link to copy', async () => {
    const { onCopyInvite, onOpenTeam } = renderChecklist({
      invite: inviteFor(SetupInviteAction.OpenTeam),
    });

    const link = screen.getByRole('link', { name: 'Invite teammates' });
    expect(link).toHaveAttribute('href', TEAM_HREF);
    await userEvent.click(link);

    expect(onOpenTeam).toHaveBeenCalledTimes(1);
    expect(onCopyInvite).not.toHaveBeenCalled();
  });

  it('hides the invite step from a member who cannot invite', () => {
    renderChecklist();

    expect(screen.queryByText('Invite your team')).not.toBeInTheDocument();
    expect(screen.getByText('2 steps')).toBeInTheDocument();
  });
});
