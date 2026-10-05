import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResultCard } from '@/shared/ui/display/ResultCard/ResultCard';
import styles from '@/shared/ui/display/ResultCard/ResultCard.module.scss';

const meta = {
  component: ResultCard,
  args: {
    source: 'Services · Notion',
    score: 0.82,
    snippet:
      'A women’s haircut takes about 45 minutes. Colouring and styling are booked as separate services.',
  },
  decorators: [
    (Story) => (
      <div className={styles.storyItem}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ResultCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithoutScore: Story = { args: { score: null } };
export const Highlighted: Story = { args: { highlight: 'haircut' } };
export const Clickable: Story = { args: { href: '/knowledge/services', highlight: 'haircut' } };
