import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '@/shared/ui/display/Card/Card';
import { CardPad } from '@/shared/ui/display/Card/Card.constants';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { Notice } from '@/shared/ui/display/Notice/Notice';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import styles from '@/shared/ui/display/Notice/Notice.module.scss';

const meta = {
  component: Notice,
  args: {
    icon: IconName.Hand,
    tone: NodeKind.Info,
    title: '2 chats are waiting for a person',
    meta: 'oldest 4 min',
    action: { label: 'Open inbox', onClick: () => undefined },
  },
  argTypes: {
    tone: { control: 'select', options: Object.values(NodeKind) },
    icon: { control: 'select', options: Object.values(IconName) },
  },
  decorators: [
    (Story) => (
      <Card pad={CardPad.Sm}>
        <ul className={styles.storyList}>
          <Story />
        </ul>
      </Card>
    ),
  ],
} satisfies Meta<typeof Notice>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithButtonAction: Story = {};
export const WithLinkAction: Story = {
  args: { action: { label: 'Open inbox', href: '/inbox' } },
};
export const WithoutAction: Story = { args: { action: null } };
export const TitleOnly: Story = { args: { action: null, meta: null } };
export const Warn: Story = {
  args: {
    icon: IconName.Alert,
    tone: NodeKind.Warn,
    title: 'Telegram token expires soon',
    meta: 'in 3 days',
    action: { label: 'Reconnect', onClick: () => undefined },
  },
};
export const Err: Story = {
  args: {
    icon: IconName.Alert,
    tone: NodeKind.Err,
    title: 'Publishing failed',
    meta: 'Booking assistant v6',
    action: { label: 'See details', onClick: () => undefined },
  },
};
export const Ok: Story = {
  args: {
    icon: IconName.Check,
    tone: NodeKind.Ok,
    title: 'Agent published',
    meta: 'just now',
    action: null,
  },
};
