import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { ListHead } from '@/shared/ui/data/ListHead/ListHead';
import { SortDirection } from '@/shared/ui/data/ListHead/ListHead.constants';
import styles from '@/shared/ui/data/ListHead/ListHead.module.scss';

const meta = {
  component: ListHead,
  args: {
    countLabel: '1,037 runs',
    sort: { label: 'Newest first', direction: SortDirection.Desc },
    onToggleSort: () => undefined,
  },
  decorators: [
    (Story) => (
      <div className={styles.storyFrame}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ListHead>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NewestFirst: Story = {};
export const OldestFirst: Story = {
  args: { sort: { label: 'Oldest first', direction: SortDirection.Asc } },
};
export const Disabled: Story = { args: { countLabel: '0 runs', disabled: true } };
export const Interactive: Story = {
  render: function InteractiveStory(args) {
    const [direction, setDirection] = useState(SortDirection.Desc);
    const newest = direction === SortDirection.Desc;
    return (
      <ListHead
        {...args}
        sort={{ label: newest ? 'Newest first' : 'Oldest first', direction }}
        onToggleSort={() => setDirection(newest ? SortDirection.Asc : SortDirection.Desc)}
      />
    );
  },
};
export const Dark: Story = { globals: { theme: ResolvedTheme.Dark } };
