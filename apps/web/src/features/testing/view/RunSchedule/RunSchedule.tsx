import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import { CHECK_ICON_SIZE } from '@/features/testing/view/RunSchedule/RunSchedule.constants';
import type { RunScheduleProps } from '@/features/testing/view/RunSchedule/RunSchedule.typedefs';
import { Button, ButtonSize } from '@/shared/ui/actions/Button';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import { Field } from '@/shared/ui/inputs/Field';
import { Select, SelectSize } from '@/shared/ui/inputs/Select';
import styles from '@/features/testing/view/RunSchedule/RunSchedule.module.scss';

export function RunSchedule({
  options,
  selectedId,
  onSelect,
  checks,
  loading,
  disabledReason,
  error,
  onRun,
}: RunScheduleProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);

  return (
    <div className={styles.root}>
      <Field label={t('schedule.startWith')}>
        {(control) => (
          <Select
            {...control}
            size={SelectSize.Sm}
            value={selectedId}
            options={options.map(({ id, name }) => ({ value: id, label: name }))}
            onChange={(event) => onSelect(event.target.value)}
          />
        )}
      </Field>
      <p className={styles.hint}>{t('schedule.description')}</p>
      <div className={styles.row}>
        <Button
          className={styles.action}
          size={ButtonSize.Sm}
          icon={IconName.Play}
          loading={loading}
          disabled={disabledReason !== null}
          onClick={onRun}
        >
          {t('schedule.run')}
        </Button>
        {disabledReason !== null && <span className={styles.hint}>{disabledReason}</span>}
      </div>
      {checks.length > 0 && (
        <ul className={styles.checks} aria-label={t('schedule.checks')}>
          {checks.map((check) => (
            <li key={check.id} className={styles.check}>
              <span className={clsx(styles.mark, check.met ? styles.met : styles.unmet)}>
                <Icon name={check.met ? IconName.Check : IconName.X} size={CHECK_ICON_SIZE} />
              </span>
              <span className={styles.label}>{check.label}</span>
              <span className={styles.state}>
                {t(check.met ? 'schedule.met' : 'schedule.notMet')}
              </span>
            </li>
          ))}
        </ul>
      )}
      {error !== null && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
