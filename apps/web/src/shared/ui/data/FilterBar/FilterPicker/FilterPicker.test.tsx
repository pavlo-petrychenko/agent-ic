import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FilterPicker } from '@/shared/ui/data/FilterBar/FilterPicker/FilterPicker';
import type {
  FilterOption,
  FilterPickerProps,
} from '@/shared/ui/data/FilterBar/FilterPicker/FilterPicker.typedefs';

const CHANNELS: FilterOption[] = [
  { id: 'telegram', label: 'Telegram', count: '1,470' },
  { id: 'api', label: 'API', count: '312' },
  { id: 'widget', label: 'Web widget', count: null },
];

const MANY: FilterOption[] = Array.from({ length: 10 }, (_, index) => ({
  id: `agent-${index}`,
  label: `Agent ${index}`,
  count: null,
}));

type PickerProps = Omit<FilterPickerProps, 'selectedIds' | 'onSelectedIdsChange'> & {
  initial?: string[];
};

function Picker({ initial = [], ...props }: PickerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initial);
  return <FilterPicker {...props} selectedIds={selectedIds} onSelectedIdsChange={setSelectedIds} />;
}

const BASE = {
  label: 'Channel',
  options: CHANNELS,
  clearLabel: 'Clear filter: Channel',
  ariaLabel: 'Channels',
};

describe('FilterPicker', () => {
  it('opens the option list from the empty chip and applies ticks at once', async () => {
    render(<Picker {...BASE} />);

    await userEvent.click(screen.getByRole('button', { name: 'Channel' }));
    const dialog = screen.getByRole('dialog', { name: 'Channels' });
    expect(within(dialog).getByText('1,470')).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'API' }));
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Telegram' }));

    expect(screen.getByRole('button', { name: 'Channel: Telegram +1' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes on Escape and returns focus to the chip', async () => {
    render(<Picker {...BASE} />);

    await userEvent.click(screen.getByRole('button', { name: 'Channel' }));
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Channel' })).toHaveFocus();
  });

  it('closes when the chip is pressed again', async () => {
    render(<Picker {...BASE} />);

    await userEvent.click(screen.getByRole('button', { name: 'Channel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Channel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('clears the selection from the chip without opening the list', async () => {
    const onSelectedIdsChange = vi.fn<(ids: string[]) => void>();
    render(
      <FilterPicker {...BASE} selectedIds={['api']} onSelectedIdsChange={onSelectedIdsChange} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Clear filter: Channel' }));

    expect(onSelectedIdsChange).toHaveBeenCalledWith([]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('adds a search over long option lists', async () => {
    render(
      <Picker
        {...BASE}
        label="Agent"
        options={MANY}
        search={{ label: 'Search agents', clearLabel: 'Clear search', placeholder: null }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Agent' }));
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search agents' }), '7');

    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    expect(screen.getByRole('checkbox', { name: 'Agent 7' })).toBeInTheDocument();
  });

  it('keeps short lists without a search', async () => {
    render(
      <Picker
        {...BASE}
        search={{ label: 'Search channels', clearLabel: 'Clear search', placeholder: null }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Channel' }));

    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });
});
