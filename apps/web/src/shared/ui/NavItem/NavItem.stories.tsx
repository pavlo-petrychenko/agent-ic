import type { Meta, StoryObj } from '@storybook/react-vite';
import { CountBadge } from '@/shared/ui/CountBadge/CountBadge';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import { NavItem } from '@/shared/ui/NavItem/NavItem';
import { withMemoryRouter } from '@test/support/helpers/storybook.helpers';
import styles from '@/shared/ui/NavItem/NavItem.module.scss';

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
