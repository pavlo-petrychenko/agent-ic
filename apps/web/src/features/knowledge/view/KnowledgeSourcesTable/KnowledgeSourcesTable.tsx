import { useTranslation } from 'react-i18next';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import { KnowledgeSourceStatus } from '@/features/knowledge/constants/knowledgeSource.constants';
import type { KnowledgeSourceRowView } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';
import type { KnowledgeSourcesTableProps } from '@/features/knowledge/view/KnowledgeSourcesTable/KnowledgeSourcesTable.typedefs';
import { Button } from '@/shared/ui/actions/Button';
import { Table, TablePadding, TableStatus } from '@/shared/ui/data/Table';
import type { TableColumn } from '@/shared/ui/data/Table';
import { TableCell, TableCellTone } from '@/shared/ui/data/TableCell';
import {
  TableCellLead,
  TableCellLeadKind,
  TableCellLeadSize,
} from '@/shared/ui/data/TableCellLead';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/knowledge/view/KnowledgeSourcesTable/KnowledgeSourcesTable.module.scss';

const STATUS_TONES: Readonly<Record<KnowledgeSourceStatus, BadgeTone>> = {
  [KnowledgeSourceStatus.Pending]: BadgeTone.Neutral,
  [KnowledgeSourceStatus.Indexing]: BadgeTone.Accent,
  [KnowledgeSourceStatus.Ready]: BadgeTone.Ok,
  [KnowledgeSourceStatus.Error]: BadgeTone.Err,
};

export function KnowledgeSourcesTable({
  rows,
  loading,
  error,
  onAddSource,
}: KnowledgeSourcesTableProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);

  const columns: readonly TableColumn<KnowledgeSourceRowView>[] = [
    {
      id: 'source',
      header: t('sources.columns.source'),
      width: 'minmax(0, 2fr)',
      render: (row) => (
        <TableCellLead
          title={row.title}
          size={TableCellLeadSize.Md}
          lead={{ kind: TableCellLeadKind.Icon, tone: NodeKind.Neutral, icon: IconName.Note }}
        />
      ),
    },
    {
      id: 'type',
      header: t('sources.columns.type'),
      width: '150px',
      render: (row) => <TableCell tone={TableCellTone.Secondary}>{row.kindLabel}</TableCell>,
    },
    {
      id: 'sync',
      header: t('sources.columns.sync'),
      width: 'minmax(0, 1fr)',
      render: (row) => (
        <TableCell tone={TableCellTone.Secondary}>
          <span className={styles.stacked}>
            <span>{row.syncLabel}</span>
            <span className={styles.meta}>{row.syncDetail}</span>
          </span>
        </TableCell>
      ),
    },
    {
      id: 'status',
      header: t('sources.columns.status'),
      width: 'minmax(0, 1fr)',
      render: (row) => (
        <TableCell>
          <span className={styles.stacked}>
            <Badge tone={STATUS_TONES[row.status]} dot>
              {row.statusLabel}
            </Badge>
            {row.statusDetail === null ? null : (
              <span className={styles.meta} title={row.statusDetail}>
                {row.statusDetail}
              </span>
            )}
          </span>
        </TableCell>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      ariaLabel={t('sources.tableLabel')}
      title={t('sources.title')}
      padding={TablePadding.Comfortable}
      toolbarActions={
        onAddSource === null ? null : (
          <Button icon={IconName.Plus} onClick={onAddSource}>
            {t('sources.add')}
          </Button>
        )
      }
      status={
        loading ? TableStatus.Loading : error === null ? TableStatus.Ready : TableStatus.Error
      }
      loadingLabel={t('sources.loading')}
      error={error}
    />
  );
}
