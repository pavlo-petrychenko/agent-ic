import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { SearchInput } from '@/shared/ui/SearchInput/SearchInput';
import styles from '@/shared/ui/SearchInput/SearchInput.module.scss';

const meta = {
  component: SearchInput,
  args: {
    value: '',
    label: 'Search conversations',
    clearLabel: 'Clear search',
    placeholder: 'Search conversations',
    onChange: () => undefined,
    onClear: () => undefined,
  },
  decorators: [
    (Story) => (
      <div className={styles.storyColumn}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SearchInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Typing: Story = { args: { value: 'refund policy' } };
export const Loading: Story = { args: { value: 'refund policy', loading: true } };
export const Disabled: Story = { args: { value: 'refund policy', disabled: true } };
export const Interactive: Story = {
  render: function InteractiveStory(args) {
    const [value, setValue] = useState('');
    return (
      <SearchInput
        {...args}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onClear={() => setValue('')}
      />
    );
  },
};
