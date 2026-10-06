import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { Button } from '@/shared/ui/actions/Button/Button';
import { EmptyState } from '@/shared/ui/display/EmptyState/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { ConversationRow } from '@/shared/ui/runs/ConversationRow/ConversationRow';
import { ConversationBadgeKind } from '@/shared/ui/runs/ConversationRow/ConversationRow.constants';
import { ConversationRowsSkeleton } from '@/shared/ui/runs/ConversationRow/ConversationRowsSkeleton';
import { withMemoryRouter } from '@test/support/helpers/storybook.helpers';
import styles from '@/shared/ui/runs/ConversationRow/ConversationRow.module.scss';

const meta = {
  component: ConversationRow,
  decorators: [withMemoryRouter],
  render: (args) => (
    <ul className={styles.storyList}>
      <li>
        <ConversationRow {...args} />
      </li>
    </ul>
  ),
  args: {
    to: '/auth/login',
    name: 'Maria Kovalenko',
    initials: 'MK',
    time: '14:02',
    dateTime: '2026-10-05T14:02:00Z',
    preview: 'Can I move my appointment to Friday?',
    channel: 'Telegram',
    agent: 'Receptionist',
  },
} satisfies Meta<typeof ConversationRow>;

export default meta;

type Story = StoryObj<typeof meta>;

const WAITING = { kind: ConversationBadgeKind.Waiting, label: 'Waiting' };
const YOU = { kind: ConversationBadgeKind.You, label: 'You' };

export const Default: Story = {};
export const Selected: Story = { args: { selected: true } };
export const Unread: Story = { args: { unread: true, unreadLabel: 'Unread' } };
export const Waiting: Story = { args: { badge: WAITING } };
export const HandledByYou: Story = { args: { badge: YOU } };
export const LongTextIsCut: Story = {
  args: {
    name: 'Alexandrina Montgomery-Wellington the Third',
    preview:
      'I would like to know whether the studio can take a group of eleven people on Friday evening',
    agent: 'Receptionist with a very long agent name',
    badge: WAITING,
  },
};

export const Inbox: Story = {
  render: (args) => (
    <ul className={styles.storyList}>
      <li>
        <ConversationRow {...args} unread unreadLabel="Unread" badge={WAITING} />
      </li>
      <li>
        <ConversationRow
          {...args}
          name="Dmytro Bondar"
          initials="DB"
          time="13:40"
          preview="Thanks, see you then"
          selected
          badge={YOU}
        />
      </li>
      <li>
        <ConversationRow
          {...args}
          name="Olena Shevchenko"
          initials="OS"
          time="Yesterday"
          preview="What are your opening hours on Sunday?"
          channel="Web widget"
        />
      </li>
    </ul>
  ),
};

export const InboxDark: Story = {
  render: Inbox.render,
  globals: { theme: ResolvedTheme.Dark },
};

export const Loading: Story = {
  render: () => (
    <div className={styles.storyList}>
      <ConversationRowsSkeleton label="Loading conversations" />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className={styles.storyList}>
      <EmptyState
        icon={IconName.Inbox}
        title="No conversations yet"
        description="Chats from your channels appear here."
      />
    </div>
  ),
};

export const EmptyAfterFiltering: Story = {
  render: () => (
    <div className={styles.storyList}>
      <EmptyState
        icon={IconName.Filter}
        title="No conversations match"
        description="Try a different channel or status."
        actions={<Button>Clear filters</Button>}
      />
    </div>
  ),
};
