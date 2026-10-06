import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { SegmentedControl } from '@/shared/ui/actions/SegmentedControl/SegmentedControl';
import { SegmentedControlSize } from '@/shared/ui/actions/SegmentedControl/SegmentedControl.constants';
import type {
  SegmentedControlOption,
  SegmentedControlProps,
} from '@/shared/ui/actions/SegmentedControl/SegmentedControl.typedefs';

const RANGE_OPTIONS: readonly SegmentedControlOption<string>[] = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
];

const LANGUAGE_OPTIONS: readonly SegmentedControlOption<string>[] = [
  { value: 'uk', label: 'УКР' },
  { value: 'en', label: 'EN' },
];

function ControlledSegmentedControl(props: SegmentedControlProps<string>) {
  const [value, setValue] = useState(props.value);
  return (
    <SegmentedControl
      {...props}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        props.onValueChange(next);
      }}
    />
  );
}

const meta = {
  component: SegmentedControl,
  render: (args) => <ControlledSegmentedControl {...args} />,
  args: {
    options: RANGE_OPTIONS,
    value: '30',
    onValueChange: () => undefined,
    ariaLabel: 'Range',
  },
  argTypes: {
    size: { control: 'select', options: Object.values(SegmentedControlSize) },
  },
} satisfies Meta<typeof SegmentedControl<string>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Medium: Story = { args: { size: SegmentedControlSize.Md } };
export const Small: Story = {
  args: {
    size: SegmentedControlSize.Sm,
    options: LANGUAGE_OPTIONS,
    value: 'en',
    ariaLabel: 'Language',
  },
};
export const WithDisabledOption: Story = {
  args: {
    options: [
      { value: '7', label: '7 days' },
      { value: '30', label: '30 days' },
      { value: '90', label: '90 days', disabled: true },
    ],
  },
};
export const LongLabel: Story = {
  args: {
    options: [
      { value: 'none', label: 'None' },
      { value: 'signed', label: 'Signed (HMAC)' },
    ],
    value: 'signed',
    ariaLabel: 'Authentication',
  },
};
export const Disabled: Story = { args: { disabled: true } };
