import { useTranslation } from 'react-i18next';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import type { SimulateInactivityProps } from '@/features/testing/view/SimulateInactivity/SimulateInactivity.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/testing/view/SimulateInactivity/SimulateInactivity.module.scss';

export function SimulateInactivity({
  hint,
  loading,
  disabled,
  error,
  onSimulate,
}: SimulateInactivityProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);

  return (
    <div className={styles.root}>
      <div className={styles.row}>
        <Button
          className={styles.action}
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Sm}
          icon={IconName.Hour}
          loading={loading}
          disabled={disabled}
          onClick={onSimulate}
        >
          {t('inactivity.simulate')}
        </Button>
        <span className={styles.hint}>{hint}</span>
      </div>
      {error !== null && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
