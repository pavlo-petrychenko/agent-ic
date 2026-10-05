import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StatusBar } from '@/shared/ui/StatusBar/StatusBar';
import { StatusTone } from '@/shared/ui/StatusBar/StatusBar.constants';

describe('StatusBar', () => {
  it('announces the status text with its detail', () => {
    render(<StatusBar tone={StatusTone.Ok} label="Last run passed" detail="2 min ago" />);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Last run passed');
    expect(status).toHaveTextContent('2 min ago');
  });

  it('colours the dot by tone', () => {
    const { container, rerender } = render(<StatusBar tone={StatusTone.Ok} label="Passed" />);
    expect(container.querySelector('[data-kind="ok"]')).not.toBeNull();

    rerender(<StatusBar tone={StatusTone.Err} label="Failed" />);
    expect(container.querySelector('[data-kind="err"]')).not.toBeNull();

    rerender(<StatusBar tone={StatusTone.Neutral} label="Not run" />);
    expect(container.querySelector('[data-kind="idle"]')).not.toBeNull();
  });

  it('runs the action when it is clicked', async () => {
    const onClick = vi.fn<() => void>();
    render(<StatusBar label="Passed" action={{ label: 'View run', onClick }} />);

    await userEvent.click(screen.getByRole('button', { name: 'View run' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows no action or detail when it has none', () => {
    render(<StatusBar label="Passed" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('status').children).toHaveLength(2);
  });
});
