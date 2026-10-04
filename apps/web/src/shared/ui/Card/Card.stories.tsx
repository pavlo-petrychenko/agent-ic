import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '@/shared/ui/Card/Card';

const meta = {
  component: Card,
  args: { children: 'Cards group related content on a white surface.' },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithTitle: Story = { args: { title: 'Workspace' } };
