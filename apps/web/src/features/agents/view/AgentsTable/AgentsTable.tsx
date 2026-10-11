import { useTranslation } from 'react-i18next';
import { AGENTS_NAMESPACE } from '@/features/agents/constants/agentsI18n.constants';
import { AGENT_STATUSES } from '@/features/agents/constants/agentStatus.constants';
import {
  AGENT_COLUMN_WIDTHS,
  AGENT_STATUS_TONES,
  AgentColumn,
  STATUS_FILTER_ID,
} from '@/features/agents/view/AgentsTable/AgentsTable.constants';
import type { AgentsTableProps } from '@/features/agents/view/AgentsTable/AgentsTable.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { FilterBar } from '@/shared/ui/data/FilterBar';
import { Table } from '@/shared/ui/data/Table';
import { TableCell, TableCellTone } from '@/shared/ui/data/TableCell';
import { TableCellLead, TableCellLeadKind } from '@/shared/ui/data/TableCellLead';
import { Badge } from '@/shared/ui/display/Badge';
import { EmptyState } from '@/shared/ui/display/EmptyState';
import { NodeKind } from '@/shared/ui/display/NodeTile';
import { IconName } from '@/shared/ui/foundations/Icon';

export function AgentsTable({
  rows,
  status,
  statusIds,
  hasNextPage,
  loadingMore,
  onStatusIdsChange,
  onClearFilters,
  onLoadMore,
  onRetry,
  onOpen,
}: AgentsTableProps) {
  const { t } = useTranslation(AGENTS_NAMESPACE);

  return (
    <div className="flex flex-col gap-3">
      <FilterBar
        ariaLabel={t('filters.label')}
        search={null}
        filters={[
          {
            id: STATUS_FILTER_ID,
            label: t('filters.status'),
            ariaLabel: t('filters.status'),
            clearLabel: t('filters.clear'),
            options: AGENT_STATUSES.map((status) => ({
              id: status,
              label: t(`filters.statuses.${status}`),
              count: null,
            })),
            selectedIds: statusIds,
            onSelectedIdsChange: onStatusIdsChange,
          },
        ]}
        onClearAll={onClearFilters}
        clearAllLabel={t('filters.clearAll')}
      />
      <Table
        ariaLabel={t('list.label')}
        loadingLabel={t('list.loading')}
        rows={rows}
        getRowId={(row) => row.id}
        onRowOpen={onOpen}
        status={status}
        error={{ message: t('list.error'), retryLabel: t('list.retry'), onRetry }}
        empty={
          <EmptyState
            icon={IconName.Search}
            title={t('list.noMatch.title')}
            description={t('list.noMatch.description')}
            actions={
              <Button
                variant={ButtonVariant.Secondary}
                size={ButtonSize.Sm}
                onClick={onClearFilters}
              >
                {t('filters.clearAll')}
              </Button>
            }
          />
        }
        columns={[
          {
            id: AgentColumn.Name,
            header: t('list.columns.agent'),
            width: AGENT_COLUMN_WIDTHS[AgentColumn.Name],
            render: (row) => (
              <TableCellLead
                title={row.name}
                subtitle={row.description}
                lead={{ kind: TableCellLeadKind.Icon, tone: NodeKind.Agent }}
              />
            ),
          },
          {
            id: AgentColumn.Status,
            header: t('list.columns.status'),
            width: AGENT_COLUMN_WIDTHS[AgentColumn.Status],
            render: (row) => (
              <span className="flex flex-col items-start gap-0.5">
                <Badge tone={AGENT_STATUS_TONES[row.status]} dot>
                  {row.statusLabel}
                </Badge>
                {row.note !== null && <TableCell tone={TableCellTone.Mute}>{row.note}</TableCell>}
              </span>
            ),
          },
        ]}
        footer={
          hasNextPage ? (
            <Button
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Sm}
              loading={loadingMore}
              onClick={onLoadMore}
            >
              {t('list.loadMore')}
            </Button>
          ) : null
        }
      />
    </div>
  );
}
