import clsx from 'clsx';
import type { BulletListProps } from '@/shared/ui/display/BulletList/BulletList.typedefs';
import styles from '@/shared/ui/display/BulletList/BulletList.module.scss';

export function BulletList({ items, className, ...rest }: BulletListProps) {
  return (
    <ul {...rest} className={clsx(styles.root, className)}>
      {items.map((item, index) => (
        <li key={index} className={styles.item}>
          {item}
        </li>
      ))}
    </ul>
  );
}
