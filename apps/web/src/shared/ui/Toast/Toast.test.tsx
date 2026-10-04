import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/shared/ui/Toast/Toast';
import { ToastTone } from '@/shared/ui/Toast/Toast.constants';
import type { ToastOptions } from '@/shared/ui/Toast/Toast.typedefs';
import { useToast } from '@/shared/ui/Toast/useToast';

function Trigger(options: ToastOptions) {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => showToast(options)}>
      Notify
    </button>
  );
}

async function notify(options: ToastOptions) {
  render(
    <ToastProvider closeLabel="Close">
      <Trigger {...options} />
    </ToastProvider>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Notify' }));
}

describe('Toast', () => {
  it('shows a message and closes it on request', async () => {
    await notify({ message: 'Changes saved' });

    expect(await screen.findByText('Changes saved')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByText('Changes saved')).not.toBeInTheDocument();
  });

  it('announces info and success as a status', async () => {
    await notify({ message: 'Changes saved', tone: ToastTone.Ok });

    const toast = (await screen.findByText('Changes saved')).closest('li');

    expect(toast).toHaveAttribute('role', 'status');
    expect(toast?.querySelector('[data-icon="check"]')).not.toBeNull();
  });

  it('announces an error as an alert with the alert icon', async () => {
    await notify({ message: 'Could not save', tone: ToastTone.Err });

    const toast = (await screen.findByText('Could not save')).closest('li');

    expect(toast).toHaveAttribute('role', 'alert');
    expect(toast?.querySelector('[data-icon="alert"]')).not.toBeNull();
  });

  it('uses the info icon by default', async () => {
    await notify({ message: 'Heads up' });

    const toast = (await screen.findByText('Heads up')).closest('li');

    expect(toast?.querySelector('[data-icon="info"]')).not.toBeNull();
  });

  it('runs the action and then dismisses the toast', async () => {
    const onClick = vi.fn<() => void>();
    await notify({ message: 'Agent deleted', action: { label: 'Undo', onClick } });

    await userEvent.click(await screen.findByRole('button', { name: 'Undo' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Agent deleted')).not.toBeInTheDocument();
  });

  it('dismisses an info toast on its own after the duration', async () => {
    const MESSAGE = 'Saved';
    const SHORT_DURATION_MS = 20;
    await notify({ message: MESSAGE, durationMs: SHORT_DURATION_MS });

    expect(await screen.findByText(MESSAGE)).toBeInTheDocument();

    await vi.waitFor(() => expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument());
  });

  it('keeps an error toast until it is closed', async () => {
    const MESSAGE = 'Could not save';
    await notify({ message: MESSAGE, tone: ToastTone.Err });

    expect(await screen.findByText(MESSAGE)).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(screen.getByText(MESSAGE)).toBeInTheDocument();
  });

  it('throws when used outside the provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<Trigger message="x" />)).toThrow(
      'useToast must be used inside ToastProvider',
    );

    consoleError.mockRestore();
  });
});
