import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusBar } from '@/shared/ui/StatusBar/StatusBar';
import { StatusTone } from '@/shared/ui/StatusBar/StatusBar.constants';
import styles from '@/shared/ui/StatusBar/StatusBar.module.scss';

const meta = {
  component: StatusBar,
  decorators: [
    (Story) => (
      <div className={styles.storyFrame}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    tone: { control: 'select', options: Object.values(StatusTone) },
  },
  args: {
    tone: StatusTone.Ok,
    label: 'Last test run passed',
    detail: '4 steps · 2 min ago',
    action: { label: 'View run', onClick: () => undefined },
  },
} satisfies Meta<typeof StatusBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ok: Story = {};
export const Warn: Story = {
  args: { tone: StatusTone.Warn, label: 'Last test run was slow', detail: '14 s · 5 min ago' },
};
export const Err: Story = {
  args: { tone: StatusTone.Err, label: 'Last test run failed', detail: 'Step 3 · 1 min ago' },
};
export const Neutral: Story = {
  args: { tone: StatusTone.Neutral, label: 'Not run yet', detail: null, action: null },
};
export const WithoutAction: Story = { args: { action: null } };
export const LongDetailTruncates: Story = {
  args: {
    detail:
      'A very long detail line that does not fit in the bar and is cut with an ellipsis instead of pushing the action out',
  },
};
