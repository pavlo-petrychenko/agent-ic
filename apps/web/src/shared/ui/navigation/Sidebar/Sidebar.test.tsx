import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { Sidebar } from '@/shared/ui/navigation/Sidebar/Sidebar';
import type { SidebarProps } from '@/shared/ui/navigation/Sidebar/Sidebar.typedefs';
import { MemoryRouter } from '@test/support/components/MemoryRouter';

const PROPS: SidebarProps = {
  ariaLabel: 'Main',
  collapseLabel: 'Collapse sidebar',
  onCollapse: () => undefined,
  workspaceSwitcher: {
    current: { id: 'demo', name: 'Demo Salon', roleLabel: 'Owner' },
    options: [{ id: 'demo', name: 'Demo Salon', roleLabel: 'Owner', memberCount: 5 }],
    onSelect: () => undefined,
    menuLabel: 'Account menu',
    workspacesLabel: 'Workspaces',
    accountLabel: 'Account',
    formatMemberCount: (count) => `${count} members`,
  },
  groups: [
    {
      id: 'build',
      label: 'Build',
      items: [
        {
          id: 'agents',
          to: '/',
          label: 'Agents',
          icon: IconName.Agent,
          badgeCount: null,
          badgeLabel: null,
        },
      ],
    },
    {
      id: 'operate',
      label: 'Operate',
      items: [
        {
          id: 'inbox',
          to: '/auth/sign-up',
          label: 'Inbox',
          icon: IconName.Inbox,
          badgeCount: 3,
          badgeLabel: '3 unread',
        },
      ],
    },
  ],
  footerItems: [
    {
      id: 'settings',
      to: '/auth/login',
      label: 'Settings',
      icon: IconName.Gear,
      badgeCount: null,
      badgeLabel: null,
    },
  ],
  user: { name: 'Olena Koval', roleLabel: 'Admin', initials: 'OK' },
  language: null,
};

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'EN' },
  { value: 'uk', label: 'UK' },
];

describe('Sidebar', () => {
  it('is a labelled navigation with grouped links', async () => {
    render(
      <MemoryRouter>
        <Sidebar {...PROPS} />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    const build = screen.getByRole('list', { name: 'Build' });
    expect(within(build).getByRole('link', { name: 'Agents' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/auth/login');
  });

  it('shows the unread count and reads it out with its label', async () => {
    render(
      <MemoryRouter>
        <Sidebar {...PROPS} />
      </MemoryRouter>,
    );

    const inbox = await screen.findByRole('link', { name: /Inbox/ });
    expect(inbox).toHaveTextContent('3');
    expect(inbox).toHaveAccessibleName(/3 unread$/);
  });

  it('collapses from the collapse button', async () => {
    const onCollapse = vi.fn<() => void>();
    render(
      <MemoryRouter>
        <Sidebar {...PROPS} onCollapse={onCollapse} />
      </MemoryRouter>,
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Collapse sidebar' }));

    expect(onCollapse).toHaveBeenCalledTimes(1);
  });

  it('shows the signed-in user and switches language', async () => {
    const onValueChange = vi.fn<(value: string) => void>();
    render(
      <MemoryRouter>
        <Sidebar
          {...PROPS}
          language={{
            ariaLabel: 'Language',
            value: 'en',
            options: LANGUAGE_OPTIONS,
            onValueChange,
          }}
        />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Olena Koval')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: 'UK' }));

    expect(onValueChange).toHaveBeenCalledWith('uk');
  });
});
