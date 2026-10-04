import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from '@/shared/ui/Select/Select';
import { SelectSize } from '@/shared/ui/Select/Select.constants';

const meta = {
  component: Select,
  args: {
    'aria-label': 'Version',
    options: [
      { value: 'latest', label: 'Follow latest' },
      { value: 'v4', label: 'Pin v4' },
      { value: 'v3', label: 'Pin v3' },
      { value: 'v2', label: 'Pin v2 (retired)', disabled: true },
    ],
  },
  argTypes: {
    size: { control: 'select', options: Object.values(SelectSize) },
  },
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Small: Story = { args: { size: SelectSize.Sm } };
export const Preselected: Story = { args: { defaultValue: 'v4' } };
export const Invalid: Story = { args: { invalid: true } };
export const WithError: Story = { args: { error: 'Pick an agent' } };
export const Disabled: Story = { args: { disabled: true } };
