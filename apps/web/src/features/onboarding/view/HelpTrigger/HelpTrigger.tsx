import clsx from 'clsx';
import { HELP_ICON } from '@/features/onboarding/constants/helpMenu.constants';
import { HELP_TRIGGER_ICON_SIZE } from '@/features/onboarding/view/HelpTrigger/HelpTrigger.constants';
import type { HelpTriggerProps } from '@/features/onboarding/view/HelpTrigger/HelpTrigger.typedefs';
import { Icon } from '@/shared/ui/foundations/Icon';
import styles from '@/features/onboarding/view/HelpTrigger/HelpTrigger.module.scss';

export function HelpTrigger({ label, compact, className, ...rest }: HelpTriggerProps) {
  return (
    <button
      type="button"
      {...rest}
      aria-label={compact ? label : undefined}
      title={compact ? label : undefined}
      className={clsx(styles.root, compact && styles.compact, className)}
    >
      <span className={styles.icon}>
        <Icon name={HELP_ICON} size={HELP_TRIGGER_ICON_SIZE} />
      </span>
      {compact ? null : <span className={styles.label}>{label}</span>}
    </button>
  );
}
