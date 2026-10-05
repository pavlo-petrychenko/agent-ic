import clsx from 'clsx';
import type { FileRowListProps } from '@/shared/ui/FileRow/FileRowList/FileRowList.typedefs';
import styles from '@/shared/ui/FileRow/FileRowList/FileRowList.module.scss';

export function FileRowList({ className, children, ...rest }: FileRowListProps) {
  return (
    <ul {...rest} className={clsx(styles.root, className)}>
      {children}
    </ul>
  );
}
