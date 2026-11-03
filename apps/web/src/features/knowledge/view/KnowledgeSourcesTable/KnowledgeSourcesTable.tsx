import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import {
  KnowledgeSourceKind,
  KnowledgeSourceMenuAction,
} from '@/features/knowledge/constants/knowledgeSource.constants';
import type { KnowledgeSourceRowView } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';
import { STATUS_TONES } from '@/features/knowledge/view/KnowledgeSourcesTable/KnowledgeSourcesTable.constants';
import type { KnowledgeSourcesTableProps } from '@/features/knowledge/view/KnowledgeSourcesTable/KnowledgeSourcesTable.typedefs';
import { Button } from '@/shared/ui/actions/Button';
import { Table, TablePadding, TableStatus } from '@/shared/ui/data/Table';
import type { TableColumn, TableRowActions } from '@/shared/ui/data/Table';
import { TableCell, TableCellTone } from '@/shared/ui/data/TableCell';
import {
  TableCellLead,
  TableCellLeadKind,
  TableCellLeadSize,
} from '@/shared/ui/data/TableCellLead';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/knowledge/view/KnowledgeSourcesTable/KnowledgeSourcesTable.module.scss';

export function KnowledgeSourcesTable({
  rows,
  loading,
  error,
  currentSourceId,
  onAddSource,
  onOpenSource,
  onSyncSource,
  onRenameSource,
  onRetrySource,
  onDeleteSource,
  retryingSourceId,
  syncingSourceId,
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
          lead={{
            kind: TableCellLeadKind.Icon,
            tone: NodeKind.Neutral,
            icon: row.kind === KnowledgeSourceKind.Upload ? IconName.Upload : IconName.Note,
          }}
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
            <Badge
              tone={row.staleDocumentCount > 0 ? BadgeTone.Warn : STATUS_TONES[row.status]}
              dot
            >
              {row.statusLabel}
            </Badge>
            {row.statusDetail === null ? null : (
              <span
                className={clsx(styles.meta, row.staleDocumentCount > 0 && styles.stale)}
                title={row.statusDetail}
              >
                {row.statusDetail}
              </span>
            )}
          </span>
        </TableCell>
      ),
    },
  ];

  const rowActions: TableRowActions<KnowledgeSourceRowView> | null =
    onSyncSource === null &&
    onRenameSource === null &&
    onRetrySource === null &&
    onDeleteSource === null
      ? null
      : {
          columnLabel: t('sources.menu.label'),
          menuLabel: t('sources.menu.label'),
          getLabel: (row) => t('sources.menu.trigger', { name: row.title }),
          getItems: (row) => [
            ...(row.canSync && onSyncSource !== null
              ? [
                  {
                    id: KnowledgeSourceMenuAction.Sync,
                    label: t('sources.menu.syncNow'),
                    leading: <Icon name={IconName.Refresh} size={14} />,
                    disabled: syncingSourceId === row.id,
                  },
                ]
              : []),
            ...(onRenameSource !== null
              ? [
                  {
                    id: KnowledgeSourceMenuAction.Rename,
                    label: t('sources.menu.rename'),
                    leading: <Icon name={IconName.Note} size={14} />,
                  },
                ]
              : []),
            ...(row.canRetry && onRetrySource !== null
              ? [
                  {
                    id: KnowledgeSourceMenuAction.Retry,
                    label: t('sources.menu.retry'),
                    leading: <Icon name={IconName.Refresh} size={14} />,
                    disabled: retryingSourceId === row.id,
                  },
                ]
              : []),
            ...(onDeleteSource !== null
              ? [
                  {
                    id: KnowledgeSourceMenuAction.Delete,
                    label: t('sources.menu.delete'),
                    leading: <Icon name={IconName.X} size={14} />,
                    danger: true,
                    disabled:
                      row.isActive || retryingSourceId === row.id || syncingSourceId === row.id,
                    hint: row.isActive ? t('sources.menu.deleteBusy') : null,
                  },
                ]
              : []),
          ],
          onSelect: (row, itemId) => {
            if (itemId === KnowledgeSourceMenuAction.Sync) {
              onSyncSource?.(row);
            }
            if (itemId === KnowledgeSourceMenuAction.Rename) {
              onRenameSource?.(row);
            }
            if (itemId === KnowledgeSourceMenuAction.Retry) {
              onRetrySource?.(row);
            }
            if (itemId === KnowledgeSourceMenuAction.Delete) {
              onDeleteSource?.(row);
            }
          },
          persistent: true,
        };

  return (
    <Table
      columns={columns}
      rowActions={rowActions}
      rows={rows}
      getRowId={(row) => row.id}
      currentRowId={currentSourceId}
      onRowOpen={onOpenSource}
      getOpenLabel={(row) => t('sources.details.open', { name: row.title })}
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
