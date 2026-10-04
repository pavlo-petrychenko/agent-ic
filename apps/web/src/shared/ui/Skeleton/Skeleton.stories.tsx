import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';
import { SkeletonBarHeight, SkeletonTone } from '@/shared/ui/Skeleton/Skeleton.constants';
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
      { width: '55%', height: SkeletonBarHeight.Title, tone: SkeletonTone.Strong },
      { width: '100%', height: SkeletonBarHeight.Text, tone: SkeletonTone.Soft },
      { width: '100%', height: SkeletonBarHeight.Text, tone: SkeletonTone.Soft },
      { width: '40%', height: SkeletonBarHeight.Text, tone: SkeletonTone.Soft },
    ],
  },
};

export const AllHeights: Story = {
  args: {
    lines: [
      SkeletonBarHeight.Heading,
      SkeletonBarHeight.Title,
      SkeletonBarHeight.Label,
      SkeletonBarHeight.Compact,
      SkeletonBarHeight.Text,
      SkeletonBarHeight.Hairline,
    ].map((height) => ({ width: '100%', height, tone: SkeletonTone.Strong })),
  },
};

export const NarrowWidth: Story = { args: { width: '50%' } };
