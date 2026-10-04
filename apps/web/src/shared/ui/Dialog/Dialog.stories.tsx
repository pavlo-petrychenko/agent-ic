import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button, ButtonVariant } from '@/shared/ui/Button';
import { Dialog } from './Dialog';

const meta = {
  component: Dialog,
  args: {
    open: true,
    onOpenChange: () => undefined,
    title: 'Delete agent',
    description: 'This removes the agent and its published versions.',
    closeLabel: 'Close',
    footer: (
      <>
        <Button variant={ButtonVariant.Secondary}>Cancel</Button>
        <Button variant={ButtonVariant.Danger}>Delete</Button>
      </>
    ),
  },
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithoutDescription: Story = { args: { description: null } };
