import type { Meta, StoryObj } from '@storybook/react-vite';
import { CountBadge } from '@/shared/ui/display/CountBadge/CountBadge';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { NavItem } from '@/shared/ui/navigation/NavItem/NavItem';
import { NavItemLayout } from '@/shared/ui/navigation/NavItem/NavItem.constants';
import { withMemoryRouter } from '@test/support/helpers/storybook.helpers';
import styles from '@/shared/ui/navigation/NavItem/NavItem.module.scss';

const meta = {
  component: NavItem,
  decorators: [withMemoryRouter],
  args: { to: '/auth/login', children: 'Agents', icon: IconName.Agent },
} satisfies Meta<typeof NavItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Active: Story = { args: { to: '/' } };
export const WithCount: Story = {
  args: {
    to: '/auth/sign-up',
    children: 'Inbox',
    icon: IconName.Inbox,
    meta: <CountBadge count={3} />,
  },
};
export const WithoutIcon: Story = { args: { icon: null, children: 'Team', meta: '5' } };
export const Disabled: Story = { args: { disabled: true } };
export const RailItem: Story = {
  args: { layout: NavItemLayout.Rail, tooltip: 'Agents' },
};
export const RailActive: Story = {
  args: { layout: NavItemLayout.Rail, to: '/', tooltip: 'Agents' },
};
export const RailWithUnreadDot: Story = {
  args: {
    layout: NavItemLayout.Rail,
    to: '/auth/sign-up',
    icon: IconName.Inbox,
    children: 'Inbox',
    tooltip: 'Inbox · 3',
    meta: <span className={styles.storyUnreadDot} />,
  },
};
export const Rail: Story = {
  render: () => (
    <nav aria-label="Main (collapsed)" className={styles.storyRail}>
      <NavItem to="/" icon={IconName.Agent} layout={NavItemLayout.Rail}>
        Agents
      </NavItem>
      <NavItem
        to="/auth/sign-up"
        icon={IconName.Inbox}
        layout={NavItemLayout.Rail}
        tooltip="Inbox · 3"
      >
        Inbox
      </NavItem>
      <NavItem to="/auth/login" icon={IconName.Gear} layout={NavItemLayout.Rail}>
        Settings
      </NavItem>
    </nav>
  ),
};
export const Sidebar: Story = {
  render: () => (
    <nav aria-label="Main" className={styles.storyNav}>
      <NavItem to="/" icon={IconName.Agent}>
        Agents
      </NavItem>
      <NavItem to="/auth/sign-up" icon={IconName.Inbox} meta={<CountBadge count={3} />}>
        Inbox
      </NavItem>
      <NavItem to="/auth/login" icon={IconName.Gear}>
        Settings
      </NavItem>
    </nav>
  ),
};
