import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import type { NavItemData } from '@/shared/ui/navigation/NavItem';
import { Rail } from '@/shared/ui/navigation/Rail/Rail';
import { MemoryRouter } from '@test/support/components/MemoryRouter';

const AGENTS: NavItemData = {
  id: 'agents',
  to: '/',
  label: 'Agents',
  icon: IconName.Agent,
  badgeCount: null,
  badgeLabel: null,
};
const INBOX: NavItemData = {
  id: 'inbox',
  to: '/auth/sign-up',
  label: 'Inbox',
  icon: IconName.Inbox,
  badgeCount: 3,
  badgeLabel: '3 unread',
};
const SETTINGS: NavItemData = {
  id: 'settings',
  to: '/auth/login',
  label: 'Settings',
  icon: IconName.Gear,
  badgeCount: null,
  badgeLabel: null,
};

function renderRail(onExpand = vi.fn<() => void>()) {
  render(
    <MemoryRouter>
      <Rail
        ariaLabel="Main (collapsed)"
        logo={<span>Logo</span>}
        groups={[[AGENTS, INBOX]]}
        footerItems={[SETTINGS]}
        expand={{ label: 'Expand sidebar', onClick: onExpand }}
      />
    </MemoryRouter>,
  );
}

describe('Rail', () => {
  it('is a labelled navigation with a named link per item', async () => {
    renderRail();

    expect(await screen.findByRole('navigation', { name: 'Main (collapsed)' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Agents' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/auth/login');
  });

  it('adds the unread count to the accessible name of an item', async () => {
    renderRail();

    expect(await screen.findByRole('link', { name: 'Inbox 3 unread' })).toBeInTheDocument();
  });

  it('names an item and its count in a tooltip on keyboard focus', async () => {
    renderRail();
    await screen.findByRole('navigation');

    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Inbox · 3');
  });

  it('expands the sidebar from the expand button', async () => {
    const onExpand = vi.fn<() => void>();
    renderRail(onExpand);

    await userEvent.click(await screen.findByRole('button', { name: 'Expand sidebar' }));

    expect(onExpand).toHaveBeenCalledTimes(1);
  });
});
