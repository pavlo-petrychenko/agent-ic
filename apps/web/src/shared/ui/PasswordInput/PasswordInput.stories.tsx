import type { Meta, StoryObj } from '@storybook/react-vite';
import { PasswordInput } from '@/shared/ui/PasswordInput/PasswordInput';

const meta = {
  component: PasswordInput,
  args: { showLabel: 'Show', hideLabel: 'Hide', 'aria-label': 'Password' },
} satisfies Meta<typeof PasswordInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Invalid: Story = { args: { invalid: true, defaultValue: 'short' } };
