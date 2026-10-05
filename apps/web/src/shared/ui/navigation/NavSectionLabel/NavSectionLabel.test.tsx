import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NavSectionLabel } from '@/shared/ui/navigation/NavSectionLabel/NavSectionLabel';

describe('NavSectionLabel', () => {
  it('shows the label without an action', () => {
    render(<NavSectionLabel label="Build" id="build" />);

    expect(screen.getByText('Build')).toHaveAttribute('id', 'build');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('runs the action from a named button', async () => {
    const onClick = vi.fn<() => void>();
    render(<NavSectionLabel label="Tools" action={{ label: 'New tool', onClick }} />);

    await userEvent.click(screen.getByRole('button', { name: 'New tool' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
