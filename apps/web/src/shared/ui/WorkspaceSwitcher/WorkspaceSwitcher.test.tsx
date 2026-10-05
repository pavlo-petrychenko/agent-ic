import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WorkspaceSwitcher } from '@/shared/ui/WorkspaceSwitcher/WorkspaceSwitcher';
import type { WorkspaceSwitcherProps } from '@/shared/ui/WorkspaceSwitcher/WorkspaceSwitcher.typedefs';

const PROPS: WorkspaceSwitcherProps = {
  current: { id: 'demo', name: 'Demo Salon', roleLabel: 'Owner' },
  options: [
    { id: 'demo', name: 'Demo Salon', roleLabel: 'Owner', memberCount: 5 },
    { id: 'acme', name: 'Acme Support', roleLabel: 'Member', memberCount: 12 },
  ],
  onSelect: () => undefined,
  menuLabel: 'Account menu',
  workspacesLabel: 'Workspaces',
  accountLabel: 'Account',
  formatMemberCount: (count) => `${count} members`,
  accountItems: [
    { id: 'profile', label: 'Profile' },
    { id: 'theme', label: 'Theme', keepOpen: true },
    { id: 'logout', label: 'Log out' },
  ],
};

describe('WorkspaceSwitcher', () => {
  it('shows the current workspace and its role on a closed menu button', () => {
    render(<WorkspaceSwitcher {...PROPS} />);

    const trigger = screen.getByRole('button', { name: /Demo Salon/ });
    expect(trigger).toHaveTextContent('Owner');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('lists the workspaces with the current one selected', async () => {
    render(<WorkspaceSwitcher {...PROPS} />);

    await userEvent.click(screen.getByRole('button', { name: /Demo Salon/ }));

    const workspaces = await screen.findByRole('listbox', { name: 'Workspaces' });
    expect(within(workspaces).getByRole('option', { name: /Demo Salon/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(within(workspaces).getByRole('option', { name: /Acme Support/ })).toHaveTextContent(
      'Member · 12 members',
    );
  });

  it('switches workspace and closes the menu', async () => {
    const onSelect = vi.fn<(id: string) => void>();
    render(<WorkspaceSwitcher {...PROPS} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: /Demo Salon/ }));
    await userEvent.click(await screen.findByRole('option', { name: /Acme Support/ }));

    expect(onSelect).toHaveBeenCalledWith('acme');
    expect(screen.queryByRole('listbox', { name: 'Workspaces' })).not.toBeInTheDocument();
  });

  it('closes after an account action but stays open for a persistent one', async () => {
    const onAccountSelect = vi.fn<(id: string) => void>();
    render(<WorkspaceSwitcher {...PROPS} onAccountSelect={onAccountSelect} />);

    await userEvent.click(screen.getByRole('button', { name: /Demo Salon/ }));
    await userEvent.click(await screen.findByRole('option', { name: 'Theme' }));

    expect(onAccountSelect).toHaveBeenLastCalledWith('theme');
    expect(screen.getByRole('option', { name: 'Log out' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('option', { name: 'Log out' }));

    expect(onAccountSelect).toHaveBeenLastCalledWith('logout');
    expect(screen.queryByRole('option', { name: 'Log out' })).not.toBeInTheDocument();
  });
});
