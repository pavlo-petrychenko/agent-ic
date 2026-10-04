import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from '@/shared/ui/Input/Input';

const meta = {
  component: Input,
  args: { placeholder: 'name@company.com' },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Invalid: Story = { args: { invalid: true, defaultValue: 'not-an-email' } };
export const Disabled: Story = { args: { disabled: true, defaultValue: 'locked@company.com' } };
