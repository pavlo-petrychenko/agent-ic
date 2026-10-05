import type { Meta, StoryObj } from '@storybook/react-vite';
import { AttentionCard } from '@/shared/ui/AttentionCard/AttentionCard';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import { NodeKind } from '@/shared/ui/NodeTile/NodeTile.constants';
import styles from '@/shared/ui/AttentionCard/AttentionCard.module.scss';

const meta = {
  component: AttentionCard,
  args: {
    title: 'Needs attention',
    rows: [
      {
        id: 'waiting',
        icon: IconName.Hand,
        title: '2 chats are waiting for a person',
        meta: 'oldest 4 min',
        action: { label: 'Open inbox', href: '/inbox' },
      },
    ],
  },
  decorators: [
    (Story) => (
      <div className={styles.storyItem}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AttentionCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SingleRow: Story = {};
export const MultipleRows: Story = {
  args: {
    rows: [
      {
        id: 'waiting',
        icon: IconName.Hand,
        title: '2 chats are waiting for a person',
        meta: 'oldest 4 min',
        action: { label: 'Open inbox', href: '/inbox' },
      },
      {
        id: 'token',
        icon: IconName.Alert,
        tone: NodeKind.Warn,
        title: 'Telegram token expires soon',
        meta: 'in 3 days',
        action: { label: 'Reconnect', href: '/channels' },
      },
      {
        id: 'failed',
        icon: IconName.Alert,
        tone: NodeKind.Err,
        title: 'Publishing failed',
        meta: 'Booking assistant v6',
        action: null,
      },
    ],
  },
};
export const Loading: Story = { args: { loading: true } };
export const Empty: Story = { args: { rows: [] } };
