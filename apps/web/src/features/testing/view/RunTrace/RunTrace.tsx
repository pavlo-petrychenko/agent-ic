import { useTranslation } from 'react-i18next';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import type { RunTraceProps } from '@/features/testing/view/RunTrace/RunTrace.typedefs';
import { RunNode } from '@/shared/ui/flow/RunNode';
import styles from '@/features/testing/view/RunTrace/RunTrace.module.scss';

export function RunTrace({ cells }: RunTraceProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);

  return (
    <ol className={styles.root} aria-label={t('trace.steps')}>
      {cells.map((cell) => (
        <RunNode
          key={cell.id}
          name={cell.label}
          kind={cell.kind}
          icon={cell.icon}
          state={cell.state}
          stateLabel={t(`trace.state.${cell.state}`)}
          className={cell.linked ? styles.linked : undefined}
          style={{ gridRow: cell.row + 1, gridColumn: cell.column + 1 }}
        />
      ))}
    </ol>
  );
}
