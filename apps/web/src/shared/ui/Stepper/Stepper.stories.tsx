import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stepper } from '@/shared/ui/Stepper/Stepper';

const meta = {
  component: Stepper,
  args: {
    ariaLabel: 'Setup progress',
    completedLabel: 'completed',
    current: 1,
    steps: [
      { id: 'basics', label: 'Basics' },
      { id: 'knowledge', label: 'Knowledge' },
      { id: 'channels', label: 'Channels' },
      { id: 'review', label: 'Review' },
    ],
  },
  argTypes: {
    current: { control: { type: 'range', min: 0, max: 4, step: 1 } },
  },
} satisfies Meta<typeof Stepper>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const FirstStep: Story = { args: { current: 0 } };
export const LastStep: Story = { args: { current: 3 } };
export const AllDone: Story = { args: { current: 4 } };
