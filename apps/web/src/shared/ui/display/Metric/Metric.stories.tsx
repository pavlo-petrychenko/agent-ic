import type { Meta, StoryObj } from '@storybook/react-vite';
import { Metric } from '@/shared/ui/display/Metric/Metric';
import styles from '@/shared/ui/display/Metric/Metric.module.scss';

const meta = {
  component: Metric,
  args: {
    items: [
      { label: 'Latency', value: '1.42 s' },
      { label: 'Input tokens', value: '1,204' },
      { label: 'Output tokens', value: '318' },
      { label: 'Cost', value: '$0.0041' },
    ],
  },
} satisfies Meta<typeof Metric>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SingleValue: Story = { args: { items: [{ label: 'Latency', value: '320 ms' }] } };
export const Wrapping: Story = {
  decorators: [
    (Story) => (
      <div className={styles.narrow}>
        <Story />
      </div>
    ),
  ],
};
