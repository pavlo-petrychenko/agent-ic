import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from '@/shared/ui/Pagination/Pagination';
import { PaginationVariant } from '@/shared/ui/Pagination/Pagination.constants';
import type { PaginationProps } from '@/shared/ui/Pagination/Pagination.typedefs';

const baseProps = (overrides: Partial<PaginationProps> = {}): PaginationProps => ({
  page: 2,
  total: 120,
  pageSize: 25,
  onPageChange: vi.fn<(page: number) => void>(),
  onPageSizeChange: vi.fn<(size: number) => void>(),
  rangeLabel: '26–50 of 120',
  rowsLabel: 'Rows',
  rowsPerPageLabel: 'Rows per page',
  previousLabel: 'Previous page',
  nextLabel: 'Next page',
  navLabel: 'Pagination',
  ...overrides,
});

describe('Pagination', () => {
  it('shows the range and the page size options', () => {
    render(<Pagination {...baseProps()} />);

    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
    expect(screen.getByText('26–50 of 120')).toBeInTheDocument();
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      '25',
      '50',
      '100',
    ]);
    expect(screen.getByRole('combobox', { name: 'Rows per page' })).toHaveValue('25');
  });

  it('moves to the neighbouring pages', async () => {
    const props = baseProps();
    render(<Pagination {...props} />);

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await userEvent.click(screen.getByRole('button', { name: 'Previous page' }));

    expect(props.onPageChange).toHaveBeenNthCalledWith(1, 3);
    expect(props.onPageChange).toHaveBeenNthCalledWith(2, 1);
  });

  it('disables previous on the first page', () => {
    render(<Pagination {...baseProps({ page: 1, rangeLabel: '1–25 of 120' })} />);

    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();
  });

  it('disables next on the last page', () => {
    render(<Pagination {...baseProps({ page: 5, rangeLabel: '101–120 of 120' })} />);

    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();
  });

  it('reports the chosen page size as a number', async () => {
    const props = baseProps();
    render(<Pagination {...props} />);

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Rows per page' }), '50');

    expect(props.onPageSizeChange).toHaveBeenCalledWith(50);
  });

  it('keeps a single page when there are no rows', () => {
    render(<Pagination {...baseProps({ page: 1, total: 0, rangeLabel: '0 of 0' })} />);

    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('offers load more in the live-list variant until everything is loaded', async () => {
    const onLoadMore = vi.fn<() => void>();
    const props = baseProps({
      variant: PaginationVariant.LoadMore,
      page: 2,
      pageSize: 50,
      total: 137,
      rangeLabel: 'Showing 100 of 137',
      onLoadMore,
      loadMoreLabel: 'Load more',
    });
    const { rerender } = render(<Pagination {...props} />);

    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));

    expect(onLoadMore).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();

    rerender(<Pagination {...props} page={3} rangeLabel="Showing 137 of 137" />);

    expect(screen.getByRole('button', { name: 'Load more' })).toBeDisabled();
  });
});
