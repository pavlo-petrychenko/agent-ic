import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import {
  ThemePreference,
  ThemeToggle,
  ThemeToggleVariant,
} from '@/shared/ui/foundations/ThemeToggle';
import { WorkspaceSwitcher } from '@/shared/ui/navigation/WorkspaceSwitcher/WorkspaceSwitcher';
import type {
  WorkspaceSwitcherAccountEntry,
  WorkspaceSwitcherProps,
} from '@/shared/ui/navigation/WorkspaceSwitcher/WorkspaceSwitcher.typedefs';
import { MenuEntryKind } from '@/shared/ui/overlays/Menu';
import styles from '@/shared/ui/navigation/WorkspaceSwitcher/WorkspaceSwitcher.module.scss';

const ACCOUNT_ICON_SIZE = 14;

const THEME_LABELS = {
  [ThemePreference.Light]: 'Light',
  [ThemePreference.Dark]: 'Dark',
  [ThemePreference.System]: 'System',
};

function ThemeRow() {
  const [value, setValue] = useState(ThemePreference.Light);
  return (
    <ThemeToggle
      value={value}
      onChange={setValue}
      variant={ThemeToggleVariant.Menu}
      labels={THEME_LABELS}
      ariaLabel="Theme"
    />
  );
}

const ACCOUNT_ITEMS: readonly WorkspaceSwitcherAccountEntry[] = [
  {
    id: 'profile',
    label: 'Profile',
    hint: 'Olena Koval',
    leading: <Icon name={IconName.User} size={ACCOUNT_ICON_SIZE} />,
  },
  {
    id: 'theme',
    label: 'Theme',
    leading: <Icon name={IconName.Moon} size={ACCOUNT_ICON_SIZE} />,
    trailing: <ThemeRow />,
    keepOpen: true,
  },
  { kind: MenuEntryKind.Separator, id: 'divider' },
  {
    id: 'logout',
    label: 'Log out',
    leading: <Icon name={IconName.X} size={ACCOUNT_ICON_SIZE} />,
  },
];

const meta = {
  component: WorkspaceSwitcher,
  decorators: [
    (Story) => (
      <div className={styles.storyFrame}>
        <Story />
      </div>
    ),
  ],
  args: {
    current: { id: 'demo', name: 'Demo Salon', roleLabel: 'Owner' },
    options: [
      { id: 'demo', name: 'Demo Salon', roleLabel: 'Owner', memberCount: 5 },
      { id: 'acme', name: 'Acme Support', roleLabel: 'Member', memberCount: 12 },
      { id: 'globex', name: 'Globex', roleLabel: 'Admin', memberCount: 1 },
    ],
    onSelect: () => undefined,
    menuLabel: 'Account menu',
    workspacesLabel: 'Workspaces',
    accountLabel: 'Account',
    formatMemberCount: (count) => `${count} ${count === 1 ? 'member' : 'members'}`,
    accountItems: ACCOUNT_ITEMS,
    onAccountSelect: () => undefined,
  },
} satisfies Meta<typeof WorkspaceSwitcher>;

export default meta;

type Story = StoryObj<WorkspaceSwitcherProps>;

export const Closed: Story = {};
export const Open: Story = { args: { defaultOpen: true } };
export const WorkspacesOnly: Story = { args: { defaultOpen: true, accountItems: [] } };
export const AccountOnly: Story = { args: { defaultOpen: true, options: [] } };
export const LongName: Story = {
  args: {
    current: { id: 'demo', name: 'Demo Salon of Hair and Beauty Services', roleLabel: 'Owner' },
  },
};
