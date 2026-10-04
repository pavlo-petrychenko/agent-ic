import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea } from '@/shared/ui/Textarea/Textarea';

const meta = {
  component: Textarea,
  args: { placeholder: 'Describe what this agent does', 'aria-label': 'Description' },
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithValue: Story = {
  args: { defaultValue: 'Books appointments and answers questions about opening hours.' },
};
export const Tall: Story = { args: { rows: 8 } };
export const Mono: Story = {
  args: { mono: true, defaultValue: '{\n  "booking_id": "b_204"\n}' },
};
export const Invalid: Story = { args: { invalid: true, defaultValue: 'Too short' } };
export const Disabled: Story = { args: { disabled: true, defaultValue: 'Read only for now.' } };
