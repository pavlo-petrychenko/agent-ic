import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SortDirection } from '@/shared/ui/ListHead/ListHead.constants';
import { Table } from '@/shared/ui/Table/Table';
import { TableColumnPriority, TableStatus } from '@/shared/ui/Table/Table.constants';
import type { TableColumn, TableProps, TableSort } from '@/shared/ui/Table/Table.typedefs';
import { TableCell } from '@/shared/ui/TableCell/TableCell';
import { TableCellAlign } from '@/shared/ui/TableCell/TableCell.constants';
import { ViewportStub } from '@test/support/components/ViewportStub';

interface Agent {
  id: string;
  name: string;
  channel: string;
  runs: number;
}

const AGENTS: readonly Agent[] = [
  { id: 'a1', name: 'Booking assistant', channel: 'Telegram', runs: 412 },
  { id: 'a2', name: 'Gift card helper', channel: 'Widget', runs: 87 },
  { id: 'a3', name: 'Receptionist', channel: 'Telegram', runs: 9 },
];

const COLUMNS: readonly TableColumn<Agent>[] = [
  {
    id: 'name',
    header: 'Agent',
    width: 'minmax(0, 2fr)',
    sortable: true,
    render: (agent) => <TableCell>{agent.name}</TableCell>,
  },
  {
    id: 'channel',
    header: 'Channel',
    width: '120px',
    priority: TableColumnPriority.Low,
    render: (agent) => <TableCell>{agent.channel}</TableCell>,
  },
  {
    id: 'runs',
    header: 'Runs',
    width: '80px',
    align: TableCellAlign.End,
    sortable: true,
    render: (agent) => <TableCell align={TableCellAlign.End}>{agent.runs}</TableCell>,
  },
];

const renderTable = (props: Partial<TableProps<Agent>> = {}) =>
  render(
    <Table
      ariaLabel="Agents"
      columns={COLUMNS}
      rows={AGENTS}
      getRowId={(agent) => agent.id}
      {...props}
    />,
  );

const selection = (
  selectedIds: readonly string[],
  onSelectedIdsChange = vi.fn<(ids: string[]) => void>(),
) => ({
  selectedIds,
  onSelectedIdsChange,
  selectAllLabel: 'Select all agents',
  getRowLabel: (agent: Agent) => `Select ${agent.name}`,
  barLabel: 'Bulk actions',
  countLabel: `${selectedIds.length} selected`,
  clearLabel: 'Clear selection',
});

const bodyRows = () =>
  within(screen.getAllByRole('rowgroup')[1] ?? document.body).getAllByRole('row');

describe('Table', () => {
  it('renders a labelled table with a header and one row per item', () => {
    renderTable({ title: 'Agents' });

    expect(screen.getByRole('table', { name: 'Agents' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual([
      'Agent',
      'Channel',
      'Runs',
    ]);
    expect(bodyRows()).toHaveLength(3);
    expect(screen.getByRole('heading', { name: 'Agents' })).toBeInTheDocument();
  });

  it('cycles a sortable column through descending, ascending and off', async () => {
    const onSortChange = vi.fn<(sort: TableSort | null) => void>();
    const { rerender } = renderTable({ onSortChange });

    await userEvent.click(screen.getByRole('button', { name: 'Runs' }));
    expect(onSortChange).toHaveBeenLastCalledWith({ columnId: 'runs', direction: 'desc' });

    const descending = { columnId: 'runs', direction: SortDirection.Desc };
    rerender(
      <Table
        ariaLabel="Agents"
        columns={COLUMNS}
        rows={AGENTS}
        getRowId={(agent) => agent.id}
        sort={descending}
        onSortChange={onSortChange}
      />,
    );
    const header = screen.getByRole('columnheader', { name: 'Runs' });
    expect(header).toHaveAttribute('aria-sort', 'descending');
    expect(header.querySelector('[data-icon="arrow-down"]')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Runs' }));
    expect(onSortChange).toHaveBeenLastCalledWith({ columnId: 'runs', direction: 'asc' });

    rerender(
      <Table
        ariaLabel="Agents"
        columns={COLUMNS}
        rows={AGENTS}
        getRowId={(agent) => agent.id}
        sort={{ columnId: 'runs', direction: SortDirection.Asc }}
        onSortChange={onSortChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Runs' }));
    expect(onSortChange).toHaveBeenLastCalledWith(null);
    expect(screen.queryByRole('button', { name: 'Channel' })).not.toBeInTheDocument();
  });

  it('selects the whole page from the header and shows the selection bar', async () => {
    const onSelectedIdsChange = vi.fn<(ids: string[]) => void>();
    const { rerender } = renderTable({ selection: selection([], onSelectedIdsChange) });

    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all agents' }));
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith(['a1', 'a2', 'a3']);

    rerender(
      <Table
        ariaLabel="Agents"
        title="Agents"
        columns={COLUMNS}
        rows={AGENTS}
        getRowId={(agent) => agent.id}
        selection={selection(['a2'], onSelectedIdsChange)}
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'Select all agents' })).toHaveAttribute(
      'aria-checked',
      'mixed',
    );
    expect(screen.getByRole('checkbox', { name: 'Select Gift card helper' })).toBeChecked();
    expect(screen.getByRole('toolbar', { name: 'Bulk actions' })).toHaveTextContent('1 selected');
    expect(screen.queryByRole('heading', { name: 'Agents' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith([]);
  });

  it('opens a row on click but not from its checkbox', async () => {
    const onRowOpen = vi.fn<(agent: Agent) => void>();
    const onSelectedIdsChange = vi.fn<(ids: string[]) => void>();
    renderTable({ onRowOpen, selection: selection([], onSelectedIdsChange) });

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Receptionist' }));
    expect(onSelectedIdsChange).toHaveBeenCalledWith(['a3']);
    expect(onRowOpen).not.toHaveBeenCalled();

    await userEvent.click(screen.getByText('Gift card helper'));
    expect(onRowOpen).toHaveBeenCalledWith(AGENTS[1]);
  });

  it('moves between rows with the arrow keys, opens with Enter and toggles with Space', async () => {
    const onRowOpen = vi.fn<(agent: Agent) => void>();
    const onSelectedIdsChange = vi.fn<(ids: string[]) => void>();
    renderTable({ onRowOpen, selection: selection([], onSelectedIdsChange) });

    const [first, second] = bodyRows();
    await userEvent.tab();
    await userEvent.tab();
    expect(first).toHaveFocus();
    expect(second).toHaveAttribute('tabindex', '-1');

    await userEvent.keyboard('{ArrowDown}');
    expect(second).toHaveFocus();
    expect(second).toHaveAttribute('tabindex', '0');

    await userEvent.keyboard('{Enter}');
    expect(onRowOpen).toHaveBeenCalledWith(AGENTS[1]);

    await userEvent.keyboard(' ');
    expect(onSelectedIdsChange).toHaveBeenCalledWith(['a2']);
  });

  it('runs a row action from the row menu without opening the row', async () => {
    const onRowOpen = vi.fn<(agent: Agent) => void>();
    const onSelect = vi.fn<(agent: Agent, itemId: string) => void>();
    renderTable({
      onRowOpen,
      rowActions: {
        columnLabel: 'Actions',
        menuLabel: 'Agent actions',
        getLabel: (agent) => `Actions for ${agent.name}`,
        getItems: () => [
          { id: 'open', label: 'Open' },
          { id: 'delete', label: 'Delete', danger: true },
        ],
        onSelect,
      },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Actions for Receptionist' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Delete' }));

    expect(onSelect).toHaveBeenCalledWith(AGENTS[2], 'delete');
    expect(onRowOpen).not.toHaveBeenCalled();
    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument();
  });

  it('expands a row into a detail strip', async () => {
    const onExpandedIdsChange = vi.fn<(ids: string[]) => void>();
    const expansion = {
      onExpandedIdsChange,
      renderDetail: (agent: Agent) => `Judge notes for ${agent.name}`,
      getExpandLabel: (agent: Agent) => `Details for ${agent.name}`,
    };
    const { rerender } = renderTable({ expansion: { ...expansion, expandedIds: [] } });

    const toggle = screen.getByRole('button', { name: 'Details for Booking assistant' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(onExpandedIdsChange).toHaveBeenCalledWith(['a1']);

    rerender(
      <Table
        ariaLabel="Agents"
        columns={COLUMNS}
        rows={AGENTS}
        getRowId={(agent) => agent.id}
        expansion={{ ...expansion, expandedIds: ['a1'] }}
      />,
    );

    expect(screen.getByText('Judge notes for Booking assistant')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Details for Booking assistant' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('marks the current row and a disabled row', () => {
    renderTable({
      currentRowId: 'a1',
      isRowDisabled: (agent) => agent.id === 'a3',
      selection: selection([]),
    });

    const [first, , third] = bodyRows();
    expect(first).toHaveAttribute('aria-current', 'true');
    expect(third).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('checkbox', { name: 'Select Receptionist' })).toBeDisabled();
  });

  it('keeps the header and shows skeleton rows while loading', async () => {
    renderTable({ status: TableStatus.Loading, loadingLabel: 'Loading agents' });

    expect(screen.getByRole('table', { name: 'Agents' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getAllByRole('columnheader')).toHaveLength(3);
    expect(screen.queryByText('Booking assistant')).not.toBeInTheDocument();
    expect(await screen.findByText('Loading agents')).toBeInTheDocument();
  });

  it('shows the error with a retry action', async () => {
    const onRetry = vi.fn<() => void>();
    renderTable({
      status: TableStatus.Error,
      error: { message: 'Couldn’t load agents.', retryLabel: 'Retry', onRetry },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Couldn’t load agents.');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state when there are no rows', () => {
    renderTable({ rows: [], empty: <p>No agents match these filters</p> });

    expect(screen.getByText('No agents match these filters')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(3);
  });

  it('hides low-priority columns below 1280', () => {
    render(
      <ViewportStub width={1200}>
        <Table ariaLabel="Agents" columns={COLUMNS} rows={AGENTS} getRowId={(agent) => agent.id} />
      </ViewportStub>,
    );

    expect(screen.getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual([
      'Agent',
      'Runs',
    ]);
  });

  it('renders the footer and the pagination', () => {
    renderTable({
      footer: <span>Showing 3 of 18</span>,
      pagination: {
        page: 1,
        total: 18,
        onPageChange: () => undefined,
        onPageSizeChange: () => undefined,
        rangeLabel: '1–3 of 18',
        rowsLabel: 'Rows',
        rowsPerPageLabel: 'Rows per page',
        previousLabel: 'Previous page',
        nextLabel: 'Next page',
        navLabel: 'Pagination',
      },
    });

    expect(screen.getByText('Showing 3 of 18')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toHaveTextContent('1–3 of 18');
  });
});
