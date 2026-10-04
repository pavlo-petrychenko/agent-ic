import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from '../Input';
import { Field } from './Field';

const meta = {
  component: Field,
  args: {
    label: 'Email',
    children: ({ invalid, ...control }) => <Input {...control} invalid={invalid} />,
  },
} satisfies Meta<typeof Field>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithHint: Story = { args: { hint: 'We only use it to sign you in.' } };
export const WithError: Story = { args: { error: 'Enter a valid email address.' } };
