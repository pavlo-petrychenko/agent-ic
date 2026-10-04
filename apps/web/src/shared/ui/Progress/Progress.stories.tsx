import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress } from '@/shared/ui/Progress/Progress';
import { ProgressSize, ProgressTone } from '@/shared/ui/Progress/Progress.constants';
import styles from '@/shared/ui/Progress/Progress.module.scss';

const meta = {
  component: Progress,
  args: { value: 64, label: 'Indexing progress' },
  argTypes: {
    size: { control: 'select', options: Object.values(ProgressSize) },
    tone: { control: 'select', options: Object.values(ProgressTone) },
  },
} satisfies Meta<typeof Progress>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Small: Story = { args: { size: ProgressSize.Sm } };
export const Neutral: Story = { args: { tone: ProgressTone.Neutral } };
export const Empty: Story = { args: { value: 0 } };
export const Full: Story = { args: { value: 100 } };
export const Indeterminate: Story = { args: { value: null } };
export const AllSizesAndTones: Story = {
  render: (args) => (
    <div className={styles.storyStack}>
      {Object.values(ProgressSize).flatMap((size) =>
        Object.values(ProgressTone).map((tone) => (
          <Progress key={`${size}-${tone}`} {...args} size={size} tone={tone} />
        )),
      )}
    </div>
  ),
};
