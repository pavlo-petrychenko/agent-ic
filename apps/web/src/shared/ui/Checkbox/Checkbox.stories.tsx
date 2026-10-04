import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Checkbox } from '@/shared/ui/Checkbox/Checkbox';
import { CheckboxAlign } from '@/shared/ui/Checkbox/Checkbox.constants';
import type { CheckboxProps } from '@/shared/ui/Checkbox/Checkbox.typedefs';

function ControlledCheckbox(props: CheckboxProps) {
  const [checked, setChecked] = useState(props.checked);
  return (
    <Checkbox
      {...props}
      checked={checked}
      onCheckedChange={(next) => {
        setChecked(next);
        props.onCheckedChange(next);
      }}
    />
  );
}

const meta = {
  component: Checkbox,
  render: (args) => <ControlledCheckbox {...args} />,
  args: { checked: false, onCheckedChange: () => undefined, label: 'Email notifications' },
  argTypes: {
    align: { control: 'select', options: Object.values(CheckboxAlign) },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};
export const Checked: Story = { args: { checked: true } };
export const Indeterminate: Story = { args: { checked: 'indeterminate', label: 'Select all' } };
export const WithoutLabel: Story = {
  args: { label: null, 'aria-label': 'View agents', checked: true },
};
export const AlignedTop: Story = {
  args: {
    align: CheckboxAlign.Top,
    label: 'message.received',
    description: 'A customer sent a message',
  },
};
export const Invalid: Story = { args: { invalid: true } };
export const Disabled: Story = { args: { disabled: true } };
export const DisabledChecked: Story = { args: { disabled: true, checked: true } };
