import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Combobox } from '@/shared/ui/inputs/Combobox';
import type { ComboboxProps } from '@/shared/ui/inputs/Combobox';

const TIME_ZONES = ['UTC', 'Europe/Kyiv', 'Europe/London', 'Asia/Tokyo'].map((timeZone) => ({
  value: timeZone,
  label: timeZone,
}));

function StatefulCombobox(args: ComboboxProps) {
  const [value, setValue] = useState(args.value);
  return <Combobox {...args} value={value} onChange={setValue} />;
}

const meta = {
  component: Combobox,
  args: {
    'aria-label': 'Time zone',
    value: 'Europe/Kyiv',
    options: TIME_ZONES,
    searchLabel: 'Search time zones',
    searchClearLabel: 'Clear time zone search',
    emptyLabel: 'No time zone found',
    placeholder: 'Search time zones',
    onChange: () => undefined,
  },
  render: (args) => <StatefulCombobox {...args} />,
} satisfies Meta<typeof Combobox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { args: { value: '' } };
export const Invalid: Story = { args: { invalid: true } };
export const WithError: Story = { args: { error: 'Pick a time zone' } };
export const Disabled: Story = { args: { disabled: true } };
