import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/shared/ui/Toast/Toast';
import {
  TOAST_DURATION_MS,
  TOAST_MAX_VISIBLE,
  TOAST_WITH_ACTION_DURATION_MS,
  ToastTone,
} from '@/shared/ui/Toast/Toast.constants';
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

const NOTIFY_LABEL = 'Notify';

function MultiTrigger({ messages }: { messages: readonly string[] }) {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => messages.forEach((message) => showToast({ message }))}>
      {NOTIFY_LABEL}
    </button>
  );
}

function notifyWithFakeTimers(options: ToastOptions) {
  vi.useFakeTimers();
  render(
    <ToastProvider closeLabel="Close">
      <Trigger {...options} />
    </ToastProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: NOTIFY_LABEL }));
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe('Toast', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it('hides an info toast without an action after 4 seconds', () => {
    notifyWithFakeTimers({ message: 'Saved', tone: ToastTone.Ok });

    advance(TOAST_DURATION_MS - 1);
    expect(screen.getByText('Saved')).toBeInTheDocument();

    advance(1);
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('keeps a toast with an action for 8 seconds', () => {
    notifyWithFakeTimers({
      message: 'Deleted 2 steps',
      action: { label: 'Undo', onClick: () => undefined },
    });

    advance(TOAST_DURATION_MS + 1);
    expect(screen.getByText('Deleted 2 steps')).toBeInTheDocument();

    advance(TOAST_WITH_ACTION_DURATION_MS - TOAST_DURATION_MS);
    expect(screen.queryByText('Deleted 2 steps')).not.toBeInTheDocument();
  });

  it('keeps an error toast with an action until it is dismissed', () => {
    notifyWithFakeTimers({
      message: 'Could not save the draft',
      tone: ToastTone.Err,
      action: { label: 'Retry', onClick: () => undefined },
    });

    advance(TOAST_WITH_ACTION_DURATION_MS * 2);

    expect(screen.getByText('Could not save the draft')).toBeInTheDocument();
  });

  it('pauses the timer while the pointer is over the toast', () => {
    notifyWithFakeTimers({ message: 'Saved' });

    fireEvent.pointerMove(screen.getByText('Saved'));
    advance(TOAST_DURATION_MS * 2);

    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('pauses the timer while focus is inside the toast', () => {
    notifyWithFakeTimers({ message: 'Saved' });

    fireEvent.focusIn(screen.getByRole('button', { name: 'Close' }));
    advance(TOAST_DURATION_MS * 2);

    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('stacks the newest toast on top and shows at most three', async () => {
    const messages = ['first', 'second', 'third', 'fourth'];
    render(
      <ToastProvider closeLabel="Close">
        <MultiTrigger messages={messages} />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: NOTIFY_LABEL }));

    const viewport = await screen.findByRole('region');
    const shown = Array.from(viewport.querySelectorAll('li'), (toast) => toast.textContent);

    expect(shown).toHaveLength(TOAST_MAX_VISIBLE);
    expect(shown).toEqual(['fourth', 'third', 'second']);
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
