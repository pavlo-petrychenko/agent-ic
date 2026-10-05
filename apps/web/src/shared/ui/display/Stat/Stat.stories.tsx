import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stat } from '@/shared/ui/display/Stat/Stat';
import { StatTrendTone } from '@/shared/ui/display/Stat/Stat.constants';
import styles from '@/shared/ui/display/Stat/Stat.module.scss';

const meta = {
  component: Stat,
  args: { label: 'Conversations', value: 1284, sub: 'last 30 days' },
  decorators: [
    (Story) => (
      <div className={styles.storyItem}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Stat>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithoutSub: Story = { args: { sub: null } };
export const TrendUp: Story = {
  args: {
    label: 'Resolved by the agent',
    value: '94%',
    trend: { label: '+3%', tone: StatTrendTone.Ok },
  },
};
export const TrendDown: Story = {
  args: { label: 'Escalations', value: 37, trend: { label: '+12%', tone: StatTrendTone.Err } },
};
export const Loading: Story = { args: { loading: true } };
export const Row: Story = {
  decorators: [
    (Story) => (
      <div className={styles.storyRow}>
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <>
      <div className={styles.storyItem}>
        <Stat {...args} />
      </div>
      <div className={styles.storyItem}>
        <Stat label="Median reply time" value="4.2 s" sub="last 30 days" />
      </div>
    </>
  ),
};
