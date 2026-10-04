import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '@/shared/ui/Badge/Badge';
import { BadgeTone } from '@/shared/ui/Badge/Badge.constants';
import styles from '@/shared/ui/Badge/Badge.module.scss';

const meta = {
  component: Badge,
  args: { children: 'Live' },
  argTypes: {
    tone: { control: 'select', options: Object.values(BadgeTone) },
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithDot: Story = { args: { tone: BadgeTone.Ok, dot: true } };
export const Mono: Story = { args: { mono: true, children: 'quality 8.4' } };
export const NeutralCountPill: Story = { args: { tone: BadgeTone.Neutral, children: '12' } };
export const AllTones: Story = {
  render: (args) => (
    <div className={styles.storyRow}>
      {Object.values(BadgeTone).map((tone) => (
        <Badge key={tone} {...args} tone={tone}>
          {tone}
        </Badge>
      ))}
    </div>
  ),
};
export const AllTonesWithDot: Story = {
  render: (args) => (
    <div className={styles.storyRow}>
      {Object.values(BadgeTone).map((tone) => (
        <Badge key={tone} {...args} tone={tone} dot>
          {tone}
        </Badge>
      ))}
    </div>
  ),
};
