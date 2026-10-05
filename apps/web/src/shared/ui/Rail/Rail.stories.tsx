import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from '@/shared/ui/Icon/Icon';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import type { NavItemData } from '@/shared/ui/NavItem';
import { Rail } from '@/shared/ui/Rail/Rail';
import { withMemoryRouter } from '@test/support/helpers/storybook.helpers';
import styles from '@/shared/ui/Rail/Rail.module.scss';

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

const BUILD = [
  item('agents', '/', 'Agents', IconName.Agent),
  item('knowledge', '/auth/sign-up', 'Knowledge', IconName.Kb),
  item('tools', '/auth/login', 'Tools', IconName.Tool),
  item('channels', '/auth/forgot-password', 'Channels', IconName.Channels),
];
const INBOX = item('inbox', '/auth/reset-password', 'Inbox', IconName.Inbox, 3);
const TRACES = item('traces', '/auth/verify-email', 'Traces', IconName.Traces);
const OPERATE = [INBOX, TRACES];
const FOOTER = [
  item('developer', '/auth/accept-invite', 'Developer', IconName.Code),
  item('settings', '/auth/login', 'Settings', IconName.Gear),
];

const meta = {
  component: Rail,
  decorators: [
    withMemoryRouter,
    (Story) => (
      <div className={styles.storyFrame}>
        <Story />
      </div>
    ),
  ],
  args: {
    ariaLabel: 'Main (collapsed)',
    logo: (
      <span className={styles.storyLogo}>
        <Icon name={IconName.Logo} size={15} strokeWidth={1.8} />
      </span>
    ),
    groups: [BUILD, OPERATE],
    footerItems: FOOTER,
  },
} satisfies Meta<typeof Rail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithExpandButton: Story = {
  args: { expand: { label: 'Expand sidebar', onClick: () => undefined } },
};
export const WithDisabledItem: Story = {
  args: {
    groups: [[...BUILD, { ...TRACES, disabled: true }]],
  },
};
export const WithoutFooter: Story = { args: { footerItems: [] } };
