import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@/shared/ui/actions/Button';
import { ToastProvider } from '@/shared/ui/overlays/Toast/Toast';
import { ToastTone } from '@/shared/ui/overlays/Toast/Toast.constants';
import type { ToastOptions } from '@/shared/ui/overlays/Toast/Toast.typedefs';
import { useToast } from '@/shared/ui/overlays/Toast/useToast';

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
  args: { label: 'Show toast', message: 'Changes saved.' },
  argTypes: {
    tone: { control: 'select', options: Object.values(ToastTone) },
  },
} satisfies Meta<typeof ToastDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Info: Story = { args: { tone: ToastTone.Info, message: 'The agent is up to date.' } };
export const Ok: Story = { args: { tone: ToastTone.Ok } };
export const Err: Story = {
  args: { tone: ToastTone.Err, message: 'Could not save. Try again in a moment.' },
};
export const WithAction: Story = {
  args: {
    tone: ToastTone.Ok,
    message: 'Agent deleted.',
    action: { label: 'Undo', onClick: () => undefined },
  },
};
export const Persistent: Story = {
  args: {
    tone: ToastTone.Info,
    message: 'Stays until closed.',
    durationMs: Number.POSITIVE_INFINITY,
  },
};
