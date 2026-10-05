import clsx from 'clsx';
import type { EdgeLabelProps } from '@/shared/ui/flow/EdgeLabel/EdgeLabel.typedefs';
import styles from '@/shared/ui/flow/EdgeLabel/EdgeLabel.module.scss';

export function EdgeLabel({ text, active = false, onClick = null, className }: EdgeLabelProps) {
  const classes = clsx(styles.root, active && styles.active, className);

  if (onClick === null) {
    return <span className={classes}>{text}</span>;
  }

  return (
    <button type="button" className={clsx(classes, styles.interactive)} onClick={onClick}>
      {text}
    </button>
  );
}
