import type { Meta, StoryObj } from '@storybook/react-vite';
import { VariableChip } from '@/shared/ui/inputs/VariableChip/VariableChip';

const meta = {
  component: VariableChip,
  args: { path: 'event.output.booking_id' },
} satisfies Meta<typeof VariableChip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const InSentence: Story = {
  render: (args) => (
    <p>
      Confirm booking <VariableChip {...args} /> for the customer.
    </p>
  ),
};
export const InMonoText: Story = {
  render: (args) => (
    <code>
      GET /bookings/
      <VariableChip {...args} />
    </code>
  ),
};
