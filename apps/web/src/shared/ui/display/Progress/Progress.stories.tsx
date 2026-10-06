import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '@/shared/ui/display/Badge/Badge';
import { BadgeTone } from '@/shared/ui/display/Badge/Badge.constants';
import { Progress } from '@/shared/ui/display/Progress/Progress';
import { ProgressSize, ProgressTone } from '@/shared/ui/display/Progress/Progress.constants';
import styles from '@/shared/ui/display/Progress/Progress.module.scss';

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
export const Failed: Story = {
  args: {
    value: 40,
    tone: ProgressTone.Err,
    caption: (
      <Badge tone={BadgeTone.Err} dot>
        Failed
      </Badge>
    ),
  },
};
export const Indexed: Story = {
  args: {
    value: 100,
    caption: (
      <Badge tone={BadgeTone.Ok} dot>
        Indexed
      </Badge>
    ),
  },
};
export const WithTextCaption: Story = { args: { caption: '64%' } };
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
