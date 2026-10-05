import clsx from 'clsx';
import { PanelSide, PanelTone } from '@/shared/ui/Panel/Panel.constants';
import type { PanelProps } from '@/shared/ui/Panel/Panel.typedefs';
import styles from '@/shared/ui/Panel/Panel.module.scss';

export function Panel({
  ariaLabel,
  title = null,
  headRight = null,
  tone = PanelTone.Panel,
  side = PanelSide.None,
  inline = false,
  flush = false,
  footer = null,
  className,
  children = null,
  ...rest
}: PanelProps) {
  const hasHead = title !== null || headRight !== null;

  return (
    <aside
      {...rest}
      aria-label={ariaLabel}
      className={clsx(
        styles.root,
        styles[`tone-${tone}`],
        styles[`side-${side}`],
        inline && styles.inline,
        className,
      )}
    >
      <div className={clsx(styles.content, flush && styles.flush)}>
        {hasHead && (
          <div className={styles.head}>
            {title !== null && <h3 className={styles.title}>{title}</h3>}
            {headRight !== null && <div className={styles.headRight}>{headRight}</div>}
          </div>
        )}
        {children !== null && <div className={styles.body}>{children}</div>}
      </div>
      {footer !== null && <div className={styles.footer}>{footer}</div>}
    </aside>
  );
}
