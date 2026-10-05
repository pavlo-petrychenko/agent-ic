import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import type { NavItemData } from '@/shared/ui/navigation/NavItem';
import { Sidebar } from '@/shared/ui/navigation/Sidebar/Sidebar';
import type { SidebarGroup, SidebarProps } from '@/shared/ui/navigation/Sidebar/Sidebar.typedefs';
import { withMemoryRouter } from '@test/support/helpers/storybook.helpers';
import styles from '@/shared/ui/navigation/Sidebar/Sidebar.module.scss';

const noop = () => undefined;

const item = (
  id: string,
  to: string,
  label: string,
  icon: IconName,
  badgeCount: number | null = null,
): NavItemData => ({
  id,
  to,
  label,
  icon,
  badgeCount,
  badgeLabel: badgeCount === null ? null : `${badgeCount} unread`,
});

const GROUPS: readonly SidebarGroup[] = [
  {
    id: 'build',
    label: 'Build',
    items: [
      item('agents', '/', 'Agents', IconName.Agent),
      item('knowledge', '/auth/sign-up', 'Knowledge', IconName.Kb),
      item('tools', '/auth/login', 'Tools', IconName.Tool),
      item('channels', '/auth/forgot-password', 'Channels', IconName.Channels),
    ],
  },
  {
    id: 'operate',
    label: 'Operate',
    items: [
      item('inbox', '/auth/reset-password', 'Inbox', IconName.Inbox, 3),
      item('traces', '/auth/verify-email', 'Traces', IconName.Traces),
      item('analytics', '/auth/accept-invite', 'Analytics', IconName.Chart),
    ],
  },
];

const FOOTER_ITEMS: readonly NavItemData[] = [
  item('developer', '/auth/accept-invite', 'Developer', IconName.Code),
  item('settings', '/auth/login', 'Settings', IconName.Gear),
];

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'EN' },
  { value: 'uk', label: 'UK' },
];

function SidebarWithLanguage(props: SidebarProps) {
  const [value, setValue] = useState('en');
  return (
    <Sidebar
      {...props}
      language={{
        options: LANGUAGE_OPTIONS,
        value,
        onValueChange: setValue,
        ariaLabel: 'Language',
      }}
    />
  );
}

const meta = {
  component: Sidebar,
  decorators: [
    withMemoryRouter,
    (Story) => (
      <div className={styles.storyFrame}>
        <Story />
      </div>
    ),
  ],
  parameters: { layout: 'fullscreen' },
  args: {
    ariaLabel: 'Main',
    collapseLabel: 'Collapse sidebar',
    onCollapse: noop,
    workspaceSwitcher: {
      current: { id: 'demo', name: 'Demo Salon', roleLabel: 'Owner' },
      options: [
        { id: 'demo', name: 'Demo Salon', roleLabel: 'Owner', memberCount: 5 },
        { id: 'acme', name: 'Acme Support', roleLabel: 'Member', memberCount: 12 },
      ],
      onSelect: noop,
      menuLabel: 'Account menu',
      workspacesLabel: 'Workspaces',
      accountLabel: 'Account',
      formatMemberCount: (count) => `${count} members`,
    },
    groups: GROUPS,
    footerItems: FOOTER_ITEMS,
    user: { name: 'Olena Koval', roleLabel: 'Admin', initials: 'OK' },
    language: null,
  },
} satisfies Meta<typeof Sidebar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <SidebarWithLanguage {...args} />,
};
export const WithoutLanguageSwitch: Story = {};
export const WithoutUser: Story = { args: { user: null } };
export const WithoutGroupLabels: Story = {
  args: { groups: GROUPS.map((group) => ({ ...group, label: null })) },
};
export const WithDisabledItem: Story = {
  args: {
    groups: [
      {
        id: 'build',
        label: 'Build',
        items: [
          item('agents', '/', 'Agents', IconName.Agent),
          {
            ...item('channels', '/auth/forgot-password', 'Channels', IconName.Channels),
            disabled: true,
          },
        ],
      },
    ],
  },
};
