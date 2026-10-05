import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ThemePreference } from '@/shared/theme/constants/theme.constants';
import { ThemeToggle } from '@/shared/ui/foundations/ThemeToggle/ThemeToggle';
import { ThemeToggleVariant } from '@/shared/ui/foundations/ThemeToggle/ThemeToggle.constants';
import type { ThemeToggleProps } from '@/shared/ui/foundations/ThemeToggle/ThemeToggle.typedefs';

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
    variant: ThemeToggleVariant.Settings,
    ariaLabel: 'Theme',
    labels: {
      [ThemePreference.Light]: 'Light',
      [ThemePreference.Dark]: 'Dark',
      [ThemePreference.System]: 'System',
    },
  },
  argTypes: {
    value: { control: 'select', options: Object.values(ThemePreference) },
    variant: { control: 'select', options: Object.values(ThemeToggleVariant) },
  },
} satisfies Meta<typeof ThemeToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Settings: Story = {};
export const SettingsLight: Story = { args: { value: ThemePreference.Light } };
export const SettingsDark: Story = { args: { value: ThemePreference.Dark } };
export const Menu: Story = { args: { variant: ThemeToggleVariant.Menu } };
export const MenuLight: Story = {
  args: { variant: ThemeToggleVariant.Menu, value: ThemePreference.Light },
};
export const Disabled: Story = { args: { disabled: true } };
export const MenuDisabled: Story = {
  args: { variant: ThemeToggleVariant.Menu, disabled: true },
};
