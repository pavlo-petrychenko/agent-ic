import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';
import { SkeletonBarSize } from '@/shared/ui/Skeleton/Skeleton.constants';
import styles from '@/shared/ui/Skeleton/Skeleton.module.scss';

const meta = {
  component: Skeleton,
  args: { label: 'Loading' },
  decorators: [
    (Story) => (
      <div className={styles.demo}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomLines: Story = {
  args: {
    lines: [
      { width: '55%', size: SkeletonBarSize.Title },
      { width: '100%', size: SkeletonBarSize.Text },
      { width: '100%', size: SkeletonBarSize.Text },
      { width: '40%', size: SkeletonBarSize.Text },
    ],
  },
};

export const NarrowWidth: Story = { args: { width: '50%' } };
