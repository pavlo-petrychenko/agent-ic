import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReadonlyValue } from '@/shared/ui/inputs/ReadonlyValue/ReadonlyValue';
import { VariableChip } from '@/shared/ui/inputs/VariableChip/VariableChip';
import styles from '@/shared/ui/inputs/ReadonlyValue/ReadonlyValue.module.scss';

const meta = {
  component: ReadonlyValue,
  decorators: [
    (Story) => (
      <div className={styles.storyStack}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReadonlyValue>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Sans: Story = {
  args: { children: 'Returns the free slots for a service on a given day.' },
};
export const Mono: Story = {
  args: {
    mono: true,
    children: (
      <>
        /v1/bookings/
        <VariableChip path="event.output.booking_id" />
      </>
    ),
  },
};
export const WithCopy: Story = {
  args: {
    mono: true,
    copyText: '/v1/bookings/{{event.output.booking_id}}',
    copyLabel: 'Copy value',
    children: (
      <>
        /v1/bookings/
        <VariableChip path="event.output.booking_id" />
      </>
    ),
  },
};
export const Wrapping: Story = {
  args: {
    mono: true,
    children:
      'https://api.example-salon.com/v1/locations/central/services/haircut/availability?from=2026-10-05&to=2026-10-12',
  },
};
