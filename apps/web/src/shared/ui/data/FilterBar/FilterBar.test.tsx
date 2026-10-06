import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FilterBar } from '@/shared/ui/data/FilterBar/FilterBar';
import type { FilterBarFilter } from '@/shared/ui/data/FilterBar/FilterBar.typedefs';

const filter = (id: string, label: string, selectedIds: string[]): FilterBarFilter => ({
  id,
  label,
  options: [
    { id: 'one', label: 'One', count: null },
    { id: 'two', label: 'Two', count: null },
  ],
  selectedIds,
  onSelectedIdsChange: vi.fn<(ids: string[]) => void>(),
  clearLabel: `Clear filter: ${label}`,
  ariaLabel: label,
});

const SEARCH = {
  query: '',
  onQueryChange: vi.fn<(query: string) => void>(),
  label: 'Search runs',
  clearLabel: 'Clear search',
};

describe('FilterBar', () => {
  it('renders the search, one chip per filter and the trailing control', () => {
    render(
      <FilterBar
        search={SEARCH}
        filters={[filter('agent', 'Agent', ['one']), filter('channel', 'Channel', [])]}
        trailing={<button type="button">Last 24 h</button>}
        ariaLabel="Filters"
      />,
    );

    expect(screen.getByRole('group', { name: 'Filters' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search runs' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agent: One' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Channel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Last 24 h' })).toBeInTheDocument();
  });

  it('reports typed queries and clears them', async () => {
    const onQueryChange = vi.fn<(query: string) => void>();
    const { rerender } = render(<FilterBar search={{ ...SEARCH, onQueryChange }} filters={[]} />);

    await userEvent.type(screen.getByRole('searchbox'), 'r');
    expect(onQueryChange).toHaveBeenLastCalledWith('r');

    rerender(<FilterBar search={{ ...SEARCH, query: 'refund', onQueryChange }} filters={[]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onQueryChange).toHaveBeenLastCalledWith('');
  });

  it('offers Clear all only when two or more filters are applied', async () => {
    const onClearAll = vi.fn<() => void>();
    const { rerender } = render(
      <FilterBar
        search={null}
        filters={[filter('agent', 'Agent', ['one']), filter('channel', 'Channel', [])]}
        onClearAll={onClearAll}
        clearAllLabel="Clear all"
      />,
    );

    expect(screen.queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument();

    rerender(
      <FilterBar
        search={null}
        filters={[filter('agent', 'Agent', ['one']), filter('channel', 'Channel', ['two'])]}
        onClearAll={onClearAll}
        clearAllLabel="Clear all"
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Clear all' }));

    expect(onClearAll).toHaveBeenCalledOnce();
  });
});
