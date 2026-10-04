import clsx from 'clsx';
import { TAG_MONO_BY_DEFAULT, TagKind } from '@/shared/ui/Tag/Tag.constants';
import type { TagProps } from '@/shared/ui/Tag/Tag.typedefs';
import styles from '@/shared/ui/Tag/Tag.module.scss';

export function Tag({
  kind = TagKind.Neutral,
  mono = null,
  className,
  children,
  ...rest
}: TagProps) {
  return (
    <span
      {...rest}
      className={clsx(
        styles.root,
        styles[kind],
        (mono ?? TAG_MONO_BY_DEFAULT[kind]) && styles.mono,
        className,
      )}
    >
      {children}
    </span>
  );
}
