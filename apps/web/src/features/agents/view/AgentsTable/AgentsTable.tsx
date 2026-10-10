import { useTranslation } from 'react-i18next';
import { AGENTS_NAMESPACE } from '@/features/agents/constants/agentsI18n.constants';
import {
  AGENT_COLUMN_WIDTHS,
  AGENT_STATUS_DOTS,
  AgentColumn,
} from '@/features/agents/view/AgentsTable/AgentsTable.constants';
import type { AgentsTableProps } from '@/features/agents/view/AgentsTable/AgentsTable.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Table } from '@/shared/ui/data/Table';
import { TableCell, TableCellTone } from '@/shared/ui/data/TableCell';
import { TableCellLead, TableCellLeadKind } from '@/shared/ui/data/TableCellLead';
import { NodeKind } from '@/shared/ui/display/NodeTile';
import { StatusDot } from '@/shared/ui/display/StatusDot';

export function AgentsTable({
  rows,
  status,
  hasNextPage,
  loadingMore,
  onLoadMore,
  onRetry,
  onOpen,
}: AgentsTableProps) {
  const { t } = useTranslation(AGENTS_NAMESPACE);

  return (
    <div className="flex flex-col gap-3">
      <Table
        ariaLabel={t('list.label')}
        loadingLabel={t('list.loading')}
        rows={rows}
        getRowId={(row) => row.id}
        onRowOpen={onOpen}
        status={status}
        error={{ message: t('list.error'), retryLabel: t('list.retry'), onRetry }}
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
              <span className="flex flex-col gap-0.5">
                <StatusDot kind={AGENT_STATUS_DOTS[row.status]} label={row.statusLabel} />
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
