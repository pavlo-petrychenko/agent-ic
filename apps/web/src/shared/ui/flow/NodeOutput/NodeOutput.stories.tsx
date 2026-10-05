import type { Meta, StoryObj } from '@storybook/react-vite';
import { NodeOutput } from '@/shared/ui/flow/NodeOutput/NodeOutput';

const meta = {
  component: NodeOutput,
  args: { text: 'reply' },
} satisfies Meta<typeof NodeOutput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Variable: Story = { args: { text: 'needs_human: boolean' } };
