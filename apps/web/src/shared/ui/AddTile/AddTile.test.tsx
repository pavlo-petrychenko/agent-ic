import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AddTile } from '@/shared/ui/AddTile/AddTile';
import { AddTileLayout } from '@/shared/ui/AddTile/AddTile.constants';

describe('AddTile', () => {
  it('is a button named by its label', () => {
    render(<AddTile label="Add source" />);

    const button = screen.getByRole('button', { name: 'Add source' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button.querySelector('[data-icon="plus"]')).not.toBeNull();
  });

  it('calls onClick when pressed', async () => {
    const onClick = vi.fn<() => void>();
    render(<AddTile label="Add source" onClick={onClick} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add source' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows the sub text in the tile layout only', () => {
    const { rerender } = render(
      <AddTile label="Add source" sub="PDF or web page" layout={AddTileLayout.Tile} />,
    );

    expect(screen.getByText('PDF or web page')).toBeInTheDocument();

    rerender(<AddTile label="Add source" sub="PDF or web page" layout={AddTileLayout.Row} />);

    expect(screen.queryByText('PDF or web page')).not.toBeInTheDocument();
  });

  it('does not press when disabled', async () => {
    const onClick = vi.fn<() => void>();
    render(<AddTile label="Add source" disabled onClick={onClick} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add source' }));

    expect(screen.getByRole('button', { name: 'Add source' })).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });
});
