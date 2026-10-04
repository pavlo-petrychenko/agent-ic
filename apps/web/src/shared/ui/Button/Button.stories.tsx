import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@/shared/ui/Button/Button';
import { ButtonSize, ButtonVariant } from '@/shared/ui/Button/Button.constants';

const meta = {
  component: Button,
  args: { children: 'Save changes' },
  argTypes: {
    variant: { control: 'select', options: Object.values(ButtonVariant) },
    size: { control: 'select', options: Object.values(ButtonSize) },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { variant: ButtonVariant.Primary } };
export const Secondary: Story = { args: { variant: ButtonVariant.Secondary } };
export const Ghost: Story = { args: { variant: ButtonVariant.Ghost } };
export const Danger: Story = { args: { variant: ButtonVariant.Danger, children: 'Delete agent' } };
export const Small: Story = { args: { size: ButtonSize.Sm } };
export const Loading: Story = { args: { loading: true } };
export const Disabled: Story = { args: { disabled: true } };
