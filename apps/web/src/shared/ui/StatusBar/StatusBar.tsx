import clsx from 'clsx';
import { Button, ButtonVariant } from '@/shared/ui/Button';
import { STATUS_BAR_DOT_KIND, StatusTone } from '@/shared/ui/StatusBar/StatusBar.constants';
import type { StatusBarProps } from '@/shared/ui/StatusBar/StatusBar.typedefs';
import { StatusDot } from '@/shared/ui/StatusDot';
import styles from '@/shared/ui/StatusBar/StatusBar.module.scss';

export function StatusBar({
  tone = StatusTone.Neutral,
  label,
  detail = null,
  action = null,
  className,
}: StatusBarProps) {
  return (
    <div className={clsx(styles.root, className)}>
      <output className={styles.status}>
        <StatusDot kind={STATUS_BAR_DOT_KIND[tone]} />
        <span className={styles.label}>{label}</span>
        {detail !== null && <span className={styles.detail}>{detail}</span>}
      </output>
      {action !== null && (
        <Button variant={ButtonVariant.Ghost} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
