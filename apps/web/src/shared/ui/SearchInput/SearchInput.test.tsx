import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SearchInput } from '@/shared/ui/SearchInput/SearchInput';

function Controlled({ onClear }: { onClear: () => void }) {
  const [value, setValue] = useState('');
  return (
    <SearchInput
      value={value}
      label="Search conversations"
      clearLabel="Clear search"
      onChange={(event) => setValue(event.target.value)}
      onClear={() => {
        setValue('');
        onClear();
      }}
    />
  );
}

describe('SearchInput', () => {
  it('is a named search field', () => {
    render(
      <SearchInput
        value=""
        label="Search conversations"
        clearLabel="Clear search"
        onChange={vi.fn<() => void>()}
        onClear={vi.fn<() => void>()}
      />,
    );

    expect(screen.getByRole('searchbox', { name: 'Search conversations' })).toBeInTheDocument();
  });

  it('offers no clear button while empty', () => {
    render(
      <SearchInput
        value=""
        label="Search"
        clearLabel="Clear search"
        onChange={vi.fn<() => void>()}
        onClear={vi.fn<() => void>()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('shows a clear button once text is typed and clears on click', async () => {
    const onClear = vi.fn<() => void>();
    render(<Controlled onClear={onClear} />);

    await userEvent.type(screen.getByRole('searchbox'), 'refund');
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(onClear).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('clears on Escape when it has text', async () => {
    const onClear = vi.fn<() => void>();
    render(<Controlled onClear={onClear} />);

    await userEvent.type(screen.getByRole('searchbox'), 'refund{Escape}');

    expect(onClear).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });

  it('ignores Escape when empty', async () => {
    const onClear = vi.fn<() => void>();
    render(<Controlled onClear={onClear} />);

    await userEvent.type(screen.getByRole('searchbox'), '{Escape}');

    expect(onClear).not.toHaveBeenCalled();
  });

  it('replaces the clear button with a busy indicator while loading', () => {
    render(
      <SearchInput
        value="refund"
        label="Search"
        clearLabel="Clear search"
        loading
        onChange={vi.fn<() => void>()}
        onClear={vi.fn<() => void>()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveAttribute('aria-busy', 'true');
  });

  it('is disabled without a clear button', () => {
    render(
      <SearchInput
        value="refund"
        label="Search"
        clearLabel="Clear search"
        disabled
        onChange={vi.fn<() => void>()}
        onClear={vi.fn<() => void>()}
      />,
    );

    expect(screen.getByRole('searchbox')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });
});
