import clsx from 'clsx';
import { DIFF_SIGN_GLYPH } from '@/shared/ui/DiffLine/DiffLine.constants';
import type { DiffLineProps } from '@/shared/ui/DiffLine/DiffLine.typedefs';
import styles from '@/shared/ui/DiffLine/DiffLine.module.scss';

export function DiffLine({ sign, signLabel, className, children, ...rest }: DiffLineProps) {
  return (
    <li {...rest} className={clsx(styles.root, className)}>
      <span aria-hidden="true" className={clsx(styles.sign, styles[sign])}>
        {DIFF_SIGN_GLYPH[sign]}
      </span>
      <span className={styles.label}>{signLabel}</span>
      <span className={styles.text}>{children}</span>
    </li>
  );
}
