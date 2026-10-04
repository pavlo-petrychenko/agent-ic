import type { Meta, StoryObj } from '@storybook/react-vite';
import { SkeletonTone } from '@/shared/ui/Skeleton/Skeleton.constants';
import { SkeletonBox } from '@/shared/ui/SkeletonBox/SkeletonBox';

const meta = {
  component: SkeletonBox,
  args: { width: '28px', height: '28px' },
  argTypes: {
    tone: { control: 'select', options: Object.values(SkeletonTone) },
  },
} satisfies Meta<typeof SkeletonBox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Square: Story = {};
export const Checkbox: Story = { args: { width: '16px', height: '16px' } };
export const Badge: Story = { args: { width: '70px', height: '18px' } };
export const Block: Story = { args: { width: '240px', height: '90px' } };
export const Strong: Story = { args: { tone: SkeletonTone.Strong } };
