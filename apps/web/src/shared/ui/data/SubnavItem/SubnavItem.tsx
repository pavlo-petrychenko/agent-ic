import { createLink, type LinkComponent } from '@tanstack/react-router';
import clsx from 'clsx';
import type { MouseEvent } from 'react';
import {
  SubnavItemDepth,
  SubnavItemMetaKind,
} from '@/shared/ui/data/SubnavItem/SubnavItem.constants';
import type { SubnavItemAnchorProps } from '@/shared/ui/data/SubnavItem/SubnavItem.typedefs';
import styles from '@/shared/ui/data/SubnavItem/SubnavItem.module.scss';

function SubnavAnchor({
  label,
  selected = false,
  disabled = false,
  meta = null,
  metaKind = SubnavItemMetaKind.Count,
  depth = SubnavItemDepth.Root,
  className,
  href,
  onClick,
  tabIndex,
  ...rest
}: SubnavItemAnchorProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <a
      {...rest}
      href={href}
      aria-current={selected ? 'page' : rest['aria-current']}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : tabIndex}
      onClick={handleClick}
      className={clsx(
        styles.root,
        depth === SubnavItemDepth.Nested && styles.nested,
        disabled && styles.disabled,
        className,
      )}
    >
      <span className={styles.label}>{label}</span>
      {meta !== null && <span className={clsx(styles.meta, styles[metaKind])}>{meta}</span>}
    </a>
  );
}

const RouterSubnavAnchor = createLink(SubnavAnchor);

export const SubnavItem: LinkComponent<typeof SubnavAnchor> = (props) => (
  <RouterSubnavAnchor preload="intent" {...props} />
);
