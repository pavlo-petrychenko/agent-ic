import type { Meta, StoryObj } from '@storybook/react-vite';
import { BulletList } from '@/shared/ui/BulletList/BulletList';

const meta = {
  component: BulletList,
  args: {
    items: [
      'Greeting node now asks for the customer name first',
      'Escalation threshold raised from 2 to 3 failed answers',
      'Removed the unused "Collect phone" step',
    ],
  },
} satisfies Meta<typeof BulletList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SingleItem: Story = { args: { items: ['Only one change in this version'] } };
export const WithInlineLinks: Story = {
  args: {
    items: [
      <>
        Connected the <a href="/knowledge">product catalogue</a> source
      </>,
      'Plain text item next to a linked one',
    ],
  },
};
export const LongItems: Story = {
  args: {
    items: [
      'A long item that wraps over several lines so the hanging indent and the line height can be checked at narrow widths in the design review, light and dark.',
      'Short item',
    ],
  },
};
