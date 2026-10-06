import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { Button } from '@/shared/ui/actions/Button/Button';
import { EmptyState } from '@/shared/ui/display/EmptyState/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { RunRowsSkeleton } from '@/shared/ui/runs/RunRow';
import { RunRow } from '@/shared/ui/runs/RunRow/RunRow';
import { RunStatus } from '@/shared/ui/runs/RunRow/RunRow.constants';
import { withMemoryRouter } from '@test/support/helpers/storybook.helpers';
import styles from '@/shared/ui/runs/RunRow/RunRow.module.scss';

const meta = {
  component: RunRow,
  decorators: [withMemoryRouter],
  render: (args) => (
    <ul className={styles.storyList}>
      <li>
        <RunRow {...args} />
      </li>
    </ul>
  ),
  args: {
    to: '/auth/login',
    title: 'Booking a haircut',
    time: '2 min ago',
    dateTime: '2026-10-05T14:02:00Z',
    status: RunStatus.Ok,
    statusLabel: 'Succeeded',
    detail: ['2.9 s', '$0.007'],
  },
  argTypes: {
    status: { control: 'select', options: Object.values(RunStatus) },
    triggerIcon: { control: 'select', options: [null, ...Object.values(IconName)] },
  },
} satisfies Meta<typeof RunRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ok: Story = { args: { quality: '8.4' } };
export const Running: Story = {
  args: {
    status: RunStatus.Running,
    statusLabel: 'Running',
    detail: ['running…'],
    time: 'just now',
  },
};
export const Escalated: Story = {
  args: { status: RunStatus.Escalated, statusLabel: 'Escalated', detail: ['escalated', '0.7 s'] },
};
export const Failed: Story = {
  args: { status: RunStatus.Failed, statusLabel: 'Failed', detail: ['API timeout'] },
};
export const Selected: Story = { args: { selected: true, quality: '8.4' } };
export const LongTitleIsCut: Story = {
  args: {
    title: 'Customer asks to move a group booking of eleven people to the following Friday',
    quality: '9.1',
  },
};

export const RunList: Story = {
  render: (args) => (
    <ul className={styles.storyList}>
      <li>
        <RunRow {...args} quality="8.4" selected />
      </li>
      <li>
        <RunRow
          {...args}
          title="Opening hours question"
          status={RunStatus.Running}
          statusLabel="Running"
          detail={['running…']}
          time="just now"
        />
      </li>
      <li>
        <RunRow
          {...args}
          title="Refund request"
          status={RunStatus.Escalated}
          statusLabel="Escalated"
          detail={['escalated', '0.7 s']}
          time="12 min ago"
        />
      </li>
      <li>
        <RunRow
          {...args}
          title="Cancel booking"
          status={RunStatus.Failed}
          statusLabel="Failed"
          detail={['API timeout']}
          time="1 h ago"
        />
      </li>
    </ul>
  ),
};

export const RunListDark: Story = {
  render: RunList.render,
  globals: { theme: ResolvedTheme.Dark },
};

export const Loading: Story = {
  render: () => (
    <div className={styles.storyList}>
      <RunRowsSkeleton label="Loading runs" />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className={styles.storyList}>
      <EmptyState
        icon={IconName.Traces}
        title="No runs yet"
        description="Runs appear here once the agent handles a message."
      />
    </div>
  ),
};

export const EmptyAfterFiltering: Story = {
  render: () => (
    <div className={styles.storyList}>
      <EmptyState
        icon={IconName.Filter}
        title="No runs match"
        description="Try a different status or period."
        actions={<Button>Clear filters</Button>}
      />
    </div>
  ),
};
