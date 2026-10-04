import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../Button';
import { ToastProvider } from './Toast';
import { ToastTone } from './Toast.constants';
import type { ToastOptions } from './Toast.typedefs';
import { useToast } from './useToast';

interface ToastDemoProps extends ToastOptions {
  label: string;
}

function ToastDemo({ label, ...options }: ToastDemoProps) {
  const { showToast } = useToast();
  return <Button onClick={() => showToast(options)}>{label}</Button>;
}

const meta = {
  component: ToastDemo,
  decorators: [
    (Story) => (
      <ToastProvider closeLabel="Close">
        <Story />
      </ToastProvider>
    ),
  ],
  args: { label: 'Show toast', title: 'Changes saved', description: 'The agent is up to date.' },
} satisfies Meta<typeof ToastDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};
export const Success: Story = { args: { tone: ToastTone.Success } };
export const Failure: Story = {
  args: { tone: ToastTone.Error, title: 'Could not save', description: 'Try again in a moment.' },
};
