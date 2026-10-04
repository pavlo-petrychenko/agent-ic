import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Switch } from '@/shared/ui/Switch/Switch';
import type { SwitchProps } from '@/shared/ui/Switch/Switch.typedefs';

const SAMPLE_ROW_WIDTH = 260;

function ControlledSwitch(props: SwitchProps) {
  const [checked, setChecked] = useState(props.checked);
  return (
    <div style={{ width: SAMPLE_ROW_WIDTH }}>
      <Switch
        {...props}
        checked={checked}
        onCheckedChange={(next) => {
          setChecked(next);
          props.onCheckedChange(next);
        }}
      />
    </div>
  );
}

const meta = {
  component: Switch,
  render: (args) => <ControlledSwitch {...args} />,
  args: { checked: false, onCheckedChange: () => undefined, label: 'Send email alerts' },
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Off: Story = {};
export const On: Story = { args: { checked: true } };
export const WithoutLabel: Story = {
  args: { label: null, 'aria-label': 'Send email alerts', checked: true },
};
export const Disabled: Story = { args: { disabled: true } };
export const DisabledOn: Story = { args: { disabled: true, checked: true } };
