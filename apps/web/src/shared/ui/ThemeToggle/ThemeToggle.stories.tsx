import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ThemePreference } from '@/shared/theme/constants/theme.constants';
import { ThemeToggle } from '@/shared/ui/ThemeToggle/ThemeToggle';
import { ThemeToggleSize } from '@/shared/ui/ThemeToggle/ThemeToggle.constants';
import type { ThemeToggleProps } from '@/shared/ui/ThemeToggle/ThemeToggle.typedefs';

function ControlledThemeToggle(props: ThemeToggleProps) {
  const [value, setValue] = useState(props.value);
  return (
    <ThemeToggle
      {...props}
      value={value}
      onChange={(next) => {
        setValue(next);
        props.onChange(next);
      }}
    />
  );
}

const meta = {
  component: ThemeToggle,
  render: (args) => <ControlledThemeToggle {...args} />,
  args: {
    value: ThemePreference.System,
    onChange: () => undefined,
    label: 'Theme',
    optionLabels: {
      [ThemePreference.Light]: 'Light',
      [ThemePreference.Dark]: 'Dark',
      [ThemePreference.System]: 'System',
    },
  },
  argTypes: {
    value: { control: 'select', options: Object.values(ThemePreference) },
    size: { control: 'select', options: Object.values(ThemeToggleSize) },
  },
} satisfies Meta<typeof ThemeToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Light: Story = { args: { value: ThemePreference.Light } };
export const Dark: Story = { args: { value: ThemePreference.Dark } };
export const SmallInMenu: Story = { args: { size: ThemeToggleSize.Sm } };
export const IconsOnly: Story = { args: { withLabels: false, size: ThemeToggleSize.Sm } };
export const Disabled: Story = { args: { disabled: true } };
