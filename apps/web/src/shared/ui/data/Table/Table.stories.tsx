import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { Button } from '@/shared/ui/actions/Button/Button';
import { ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button/Button.constants';
import { TextLink } from '@/shared/ui/actions/TextLink/TextLink';
import { SortDirection } from '@/shared/ui/data/ListHead/ListHead.constants';
import { DEFAULT_PAGE_SIZE } from '@/shared/ui/data/Pagination/Pagination.constants';
import { Table } from '@/shared/ui/data/Table/Table';
import {
  TableColumnPriority,
  TableHeadTone,
  TablePadding,
  TableStatus,
} from '@/shared/ui/data/Table/Table.constants';
import type {
  TableColumn,
  TableRowActions,
  TableSelection,
  TableSort,
} from '@/shared/ui/data/Table/Table.typedefs';
import { TableCell } from '@/shared/ui/data/TableCell/TableCell';
import { TableCellAlign, TableCellTone } from '@/shared/ui/data/TableCell/TableCell.constants';
import { TableCellLead } from '@/shared/ui/data/TableCellLead/TableCellLead';
import {
  TableCellLeadKind,
  TableCellLeadSize,
} from '@/shared/ui/data/TableCellLead/TableCellLead.constants';
import { Badge } from '@/shared/ui/display/Badge/Badge';
import { BadgeTone } from '@/shared/ui/display/Badge/Badge.constants';
import { EmptyState } from '@/shared/ui/display/EmptyState/EmptyState';
import { KeyValue } from '@/shared/ui/display/KeyValue/KeyValue';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { withMemoryRouter, withViewportWidth } from '@test/support/helpers/storybook.helpers';
import styles from '@/shared/ui/data/Table/Table.module.scss';

interface StoryAgent {
  id: string;
  name: string;
  owner: string;
  live: boolean;
  runs: number;
  score: string;
}

const AGENTS: readonly StoryAgent[] = [
  { id: 'a1', name: 'Booking assistant', owner: 'Olena K.', live: true, runs: 412, score: '4.6' },
  { id: 'a2', name: 'Gift card helper', owner: 'Taras M.', live: false, runs: 87, score: '3.9' },
  { id: 'a3', name: 'Receptionist', owner: 'Olena K.', live: true, runs: 1204, score: '4.8' },
  { id: 'a4', name: 'Escalations', owner: 'Iryna S.', live: true, runs: 36, score: '4.1' },
];

const COLUMNS: readonly TableColumn<StoryAgent>[] = [
  {
    id: 'name',
    header: 'Agent',
    width: 'minmax(0, 2fr)',
    sortable: true,
    render: (agent) => (
      <TableCellLead
        title={agent.name}
        subtitle={agent.owner}
        size={TableCellLeadSize.Md}
        lead={{ kind: TableCellLeadKind.Icon, tone: NodeKind.Agent }}
      />
    ),
  },
  {
    id: 'status',
    header: 'Status',
    width: '120px',
    priority: TableColumnPriority.Low,
    render: (agent) => (
      <Badge tone={agent.live ? BadgeTone.Ok : BadgeTone.Neutral} dot>
        {agent.live ? 'Live' : 'Paused'}
      </Badge>
    ),
  },
  {
    id: 'runs',
    header: 'Runs',
    width: '80px',
    align: TableCellAlign.End,
    sortable: true,
    render: (agent) => (
      <TableCell align={TableCellAlign.End} tone={TableCellTone.Secondary}>
        {agent.runs.toLocaleString('en')}
      </TableCell>
    ),
  },
  {
    id: 'score',
    header: 'Score',
    width: '80px',
    align: TableCellAlign.End,
    sortable: true,
    priority: TableColumnPriority.Low,
    render: (agent) => (
      <TableCell align={TableCellAlign.End} tone={TableCellTone.Secondary} mono>
        {agent.score}
      </TableCell>
    ),
  },
];

const PERSON_COLUMNS: readonly TableColumn<StoryAgent>[] = [
  {
    id: 'owner',
    header: 'Member',
    width: 'minmax(0, 1.5fr)',
    render: (agent) => (
      <TableCellLead
        title={agent.owner}
        subtitle={`${agent.owner.split(' ')[0]?.toLowerCase() ?? ''}@demo-salon.example`}
        lead={{ kind: TableCellLeadKind.Avatar, initials: agent.owner.slice(0, 1) }}
      />
    ),
  },
  {
    id: 'agent',
    header: 'Agent',
    width: 'minmax(0, 1fr)',
    render: (agent) => <TableCell tone={TableCellTone.Mute}>{agent.name}</TableCell>,
  },
  {
    id: 'runs',
    header: 'Runs',
    width: '64px',
    align: TableCellAlign.End,
    render: (agent) => (
      <TableCell align={TableCellAlign.End} tone={TableCellTone.Secondary} mono>
        {agent.runs}
      </TableCell>
    ),
  },
];

const ROW_ACTIONS: TableRowActions<StoryAgent> = {
  columnLabel: 'Actions',
  menuLabel: 'Agent actions',
  getLabel: (agent) => `Actions for ${agent.name}`,
  getItems: () => [
    { id: 'open', label: 'Open', leading: null },
    { id: 'pause', label: 'Pause' },
    { id: 'delete', label: 'Delete', danger: true },
  ],
  onSelect: () => undefined,
};

const selectionFor = (selectedIds: readonly string[]): TableSelection<StoryAgent> => ({
  selectedIds,
  onSelectedIdsChange: () => undefined,
  selectAllLabel: 'Select all agents',
  getRowLabel: (agent) => `Select ${agent.name}`,
  barLabel: 'Bulk actions',
  countLabel: `${selectedIds.length} selected`,
  clearLabel: 'Clear selection',
  actions: (
    <>
      <Button variant={ButtonVariant.Secondary} size={ButtonSize.Sm} icon={IconName.Pause}>
        Pause
      </Button>
      <Button variant={ButtonVariant.Danger} size={ButtonSize.Sm}>
        Delete
      </Button>
    </>
  ),
});

const renderDetail = (agent: StoryAgent) => (
  <KeyValue
    className={styles.storyDetail}
    items={[
      { label: 'Agent id', value: `agt_${agent.id}9f2`, mono: true },
      { label: 'Last run', value: '2 min ago' },
      { label: 'Version', value: 'v4', mono: true },
    ]}
  />
);

const meta = {
  component: Table<StoryAgent>,
  args: {
    ariaLabel: 'Agents',
    title: 'Agents',
    columns: COLUMNS,
    rows: AGENTS,
    getRowId: (agent: StoryAgent) => agent.id,
    toolbarActions: (
      <Button size={ButtonSize.Sm} icon={IconName.Plus}>
        New agent
      </Button>
    ),
  },
  decorators: [
    (Story) => (
      <div className={styles.storyFrame}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Table<StoryAgent>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const HeadPanel: Story = {
  args: {
    title: 'Team',
    toolbarActions: null,
    columns: PERSON_COLUMNS,
    headTone: TableHeadTone.Panel,
    padding: TablePadding.Comfortable,
  },
};
export const Sorted: Story = {
  args: {
    sort: { columnId: 'runs', direction: SortDirection.Desc },
    onSortChange: () => undefined,
  },
};
export const CurrentRowWithDetail: Story = {
  args: {
    currentRowId: 'a1',
    onRowOpen: () => undefined,
    expansion: {
      expandedIds: ['a1'],
      onExpandedIdsChange: () => undefined,
      renderDetail,
      getExpandLabel: (agent) => `Details for ${agent.name}`,
    },
    footer: (
      <>
        <span>Showing 4 of 18</span>
        <TextLink to="/">Show all</TextLink>
      </>
    ),
  },
  decorators: [withMemoryRouter],
};
export const Expanded: Story = {
  args: {
    rowActions: ROW_ACTIONS,
    expansion: {
      expandedIds: ['a3'],
      onExpandedIdsChange: () => undefined,
      renderDetail,
      getExpandLabel: (agent) => `Details for ${agent.name}`,
    },
  },
};
export const Selection: Story = {
  args: { selection: selectionFor(['a1', 'a3']), rowActions: ROW_ACTIONS },
};
export const RowMenu: Story = { args: { rowActions: ROW_ACTIONS, onRowOpen: () => undefined } };
export const DisabledRow: Story = {
  args: {
    selection: selectionFor([]),
    rowActions: ROW_ACTIONS,
    isRowDisabled: (agent) => agent.id === 'a2',
  },
};
export const Loading: Story = {
  args: {
    status: TableStatus.Loading,
    loadingLabel: 'Loading agents',
    selection: selectionFor([]),
    rowActions: ROW_ACTIONS,
  },
};
export const EmptyFiltered: Story = {
  args: {
    rows: [],
    empty: (
      <EmptyState
        icon={IconName.Filter}
        title="No agents match these filters"
        description="Try a different status or clear the filters."
        actions={
          <Button variant={ButtonVariant.Secondary} size={ButtonSize.Sm}>
            Clear filters
          </Button>
        }
      />
    ),
  },
};
export const LoadError: Story = {
  args: {
    status: TableStatus.Error,
    error: {
      message: 'Couldn’t load agents — the connection dropped.',
      retryLabel: 'Retry',
      onRetry: () => undefined,
    },
  },
};
export const Paginated: Story = {
  args: {
    pagination: {
      page: 1,
      total: 412,
      pageSize: DEFAULT_PAGE_SIZE,
      onPageChange: () => undefined,
      onPageSizeChange: () => undefined,
      rangeLabel: '1–25 of 412',
      rowsLabel: 'Rows',
      rowsPerPageLabel: 'Rows per page',
      previousLabel: 'Previous page',
      nextLabel: 'Next page',
      navLabel: 'Pagination',
    },
  },
};
export const Narrow: Story = {
  args: { selection: selectionFor([]), rowActions: ROW_ACTIONS },
  decorators: [withViewportWidth(1200)],
};
export const Interactive: Story = {
  render: function InteractiveStory(args) {
    const [sort, setSort] = useState<TableSort | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [expandedIds, setExpandedIds] = useState<string[]>([]);
    const [currentRowId, setCurrentRowId] = useState<string | null>(null);
    return (
      <Table
        {...args}
        sort={sort}
        onSortChange={setSort}
        currentRowId={currentRowId}
        onRowOpen={(agent) => setCurrentRowId(agent.id)}
        selection={{
          ...selectionFor(selectedIds),
          onSelectedIdsChange: setSelectedIds,
        }}
        rowActions={ROW_ACTIONS}
        expansion={{
          expandedIds,
          onExpandedIdsChange: setExpandedIds,
          renderDetail,
          getExpandLabel: (agent) => `Details for ${agent.name}`,
        }}
      />
    );
  },
};
export const Dark: Story = {
  args: {
    currentRowId: 'a1',
    selection: selectionFor(['a3']),
    rowActions: ROW_ACTIONS,
    sort: { columnId: 'runs', direction: SortDirection.Desc },
    onSortChange: () => undefined,
  },
  globals: { theme: ResolvedTheme.Dark },
};
