import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ToastProvider } from '@/shared/ui/Toast/Toast';
import { useToast } from '@/shared/ui/Toast/useToast';

function Trigger() {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => showToast({ title: 'Saved', description: 'All good' })}>
      Notify
    </button>
  );
}

describe('Toast', () => {
  it('shows a toast with its title and description, and closes it on request', async () => {
    render(
      <ToastProvider closeLabel="Close">
        <Trigger />
      </ToastProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Notify' }));

    expect(await screen.findByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('All good')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });
});
