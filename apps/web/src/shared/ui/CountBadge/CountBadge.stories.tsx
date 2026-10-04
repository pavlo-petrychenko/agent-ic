import type { Meta, StoryObj } from '@storybook/react-vite';
import { CountBadge } from '@/shared/ui/CountBadge/CountBadge';

const meta = {
  component: CountBadge,
  args: { count: 3 },
} satisfies Meta<typeof CountBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const TwoDigits: Story = { args: { count: 42 } };
export const Overflow: Story = { args: { count: 128, max: 99 } };
export const AtTheLimit: Story = { args: { count: 99, max: 99 } };
