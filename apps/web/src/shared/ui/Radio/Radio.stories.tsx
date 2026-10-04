import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Radio } from '@/shared/ui/Radio/Radio';
import { RadioOrientation } from '@/shared/ui/Radio/Radio.constants';
import type { RadioProps } from '@/shared/ui/Radio/Radio.typedefs';

function ControlledRadio(props: RadioProps) {
  const [value, setValue] = useState(props.value);
  return (
    <Radio
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
  component: Radio,
  render: (args) => <ControlledRadio {...args} />,
  args: {
    name: 'version-mode',
    ariaLabel: 'Version mode',
    value: 'pinned',
    onValueChange: () => undefined,
    options: [
      { value: 'pinned', label: 'Pin v4' },
      { value: 'latest', label: 'Follow latest' },
    ],
  },
  argTypes: {
    orientation: { control: 'select', options: Object.values(RadioOrientation) },
  },
} satisfies Meta<typeof Radio>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {};
export const Vertical: Story = { args: { orientation: RadioOrientation.Vertical } };
export const NothingSelected: Story = { args: { value: null } };
export const Invalid: Story = { args: { value: null, invalid: true } };
export const OptionDisabled: Story = {
  args: {
    options: [
      { value: 'pinned', label: 'Pin v4' },
      { value: 'latest', label: 'Follow latest', disabled: true },
    ],
  },
};
export const Disabled: Story = { args: { disabled: true } };
