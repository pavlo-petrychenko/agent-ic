import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import type { IssuesBarProps } from '@/features/flow-builder/view/IssuesBar/IssuesBar.typedefs';
import { RowList } from '@/shared/ui/display/RowList';
import { StatusBar, StatusTone } from '@/shared/ui/layout/StatusBar';
import styles from '@/features/flow-builder/view/IssuesBar/IssuesBar.module.scss';

export function IssuesBar({ rows, errors, warnings, onIssueSelect }: IssuesBarProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const [open, setOpen] = useState(false);
  const first = rows[0];

  if (first === undefined) {
    return null;
  }

  return (
    <>
      {open && (
        <RowList
          aria-label={t('issues.list')}
          mono={false}
          className={styles.list}
          rows={rows.map((row) => ({
            id: row.id,
            name: row.message,
            meta: row.step,
            disabled: row.nodeId === null,
          }))}
          onRowSelect={(id) => {
            const nodeId = rows.find((row) => row.id === id)?.nodeId ?? null;
            if (nodeId !== null) {
              onIssueSelect(nodeId);
            }
          }}
        />
      )}
      <StatusBar
        tone={errors > 0 ? StatusTone.Neutral : StatusTone.Warn}
        label={errors > 0 ? t('issues.notReady') : t('issues.ready')}
        detail={errors > 0 ? first.message : t('issues.warnings', { count: warnings })}
        action={{
          label: open ? t('issues.hide') : t('issues.show', { count: rows.length }),
          onClick: () => setOpen(!open),
        }}
      />
    </>
  );
}
