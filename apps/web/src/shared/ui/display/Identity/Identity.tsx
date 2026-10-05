import clsx from 'clsx';
import { IdentitySize } from '@/shared/ui/display/Identity/Identity.constants';
import type { IdentityProps } from '@/shared/ui/display/Identity/Identity.typedefs';
import styles from '@/shared/ui/display/Identity/Identity.module.scss';

export function Identity({
  name,
  lead,
  sub = null,
  size = IdentitySize.Md,
  className,
  ...rest
}: IdentityProps) {
  return (
    <div {...rest} className={clsx(styles.root, styles[size], className)}>
      <span className={styles.lead}>{lead}</span>
      <span className={styles.stack}>
        <span className={styles.name} title={name}>
          {name}
        </span>
        {sub !== null && (
          <span className={styles.sub} title={sub}>
            {sub}
          </span>
        )}
      </span>
    </div>
  );
}
