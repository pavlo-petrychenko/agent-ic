import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from '@/shared/ui/inputs/Input/Input';
import { InputSize } from '@/shared/ui/inputs/Input/Input.constants';

const meta = {
  component: Input,
  args: { placeholder: 'name@company.com', 'aria-label': 'Email' },
  argTypes: {
    size: { control: 'select', options: Object.values(InputSize) },
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithValue: Story = { args: { defaultValue: 'ada@company.com' } };
export const Large: Story = { args: { size: InputSize.Lg } };
export const Mono: Story = {
  args: { mono: true, placeholder: '/v1/bookings/{id}', defaultValue: 'agents/booking.json' },
};
export const Invalid: Story = { args: { invalid: true, defaultValue: 'not-an-email' } };
export const Disabled: Story = { args: { disabled: true, defaultValue: 'locked@company.com' } };
