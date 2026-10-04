import type { Meta, StoryObj } from '@storybook/react-vite';
import { Field } from '@/shared/ui/Field/Field';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Textarea } from '@/shared/ui/Textarea';

const SELECT_OPTIONS = [
  { value: 'latest', label: 'Follow latest' },
  { value: 'pinned', label: 'Pin version' },
];

const meta = {
  component: Field,
  args: {
    label: 'Email',
    children: ({ invalid, required, ...control }) => (
      <Input {...control} invalid={invalid} required={required} />
    ),
  },
} satisfies Meta<typeof Field>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithHint: Story = { args: { hint: 'Always runs the published version.' } };
export const WithError: Story = { args: { error: 'Passwords don’t match' } };
export const Required: Story = { args: { required: true, requiredLabel: 'required' } };
export const Disabled: Story = {
  args: {
    children: ({ invalid, ...control }) => <Input {...control} invalid={invalid} disabled />,
  },
};
export const WithSelect: Story = {
  args: {
    label: 'Version',
    children: ({ invalid, ...control }) => (
      <Select {...control} invalid={invalid} options={SELECT_OPTIONS} />
    ),
  },
};
export const WithTextarea: Story = {
  args: {
    label: 'Description',
    hint: 'Shown to teammates.',
    children: ({ invalid, ...control }) => <Textarea {...control} invalid={invalid} />,
  },
};
